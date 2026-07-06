/**
 * soloGameStore.ts
 * Store Zustand para el Ritual Solitario.
 *
 * Responsabilidades:
 *   - Iniciar partida (generar tablero + primera pista)
 *   - Procesar selección de carta
 *   - Gestionar pausas / reanudaciones
 *   - Finalizar y guardar partida localmente
 *   - Restaurar sesión activa tras cierre de app
 *
 * NO hace llamadas Firebase directamente.
 * La sincronización se delega al soloSyncService (Fase 3).
 */

import { create } from 'zustand';
import { BoardCell, TeamColor } from '../types/game.types';
import {
  SoloGameSession,
  SoloTurn,
  CompletedSoloMatch,
  SoloStatsSummary,
  StartSoloInput,
  ActiveMediumClue,
  SoloDifficultyId,
} from '../domain/solo/types/solo.types';
import {
  DIFFICULTY_CONFIGS,
  SOLO_TO_WORD_DIFFICULTY,
} from '../domain/solo/config/difficulty.config';
import { generateBoardWithSeed } from '../services/game/BoardGenerator';
import { generateClue } from '../domain/solo/engine/clue-generator';
import {
  clueCompleted,
  clueSelectionLimitReached,
  createActiveMediumClue,
  emptyClueHistory,
  registerSelection,
  updateClueHistory,
} from '../domain/solo/engine/active-clue';
import { calculateSoloScore } from '../domain/solo/scoring/calculate-score';
import { MatchClock, ClockSnapshot } from '../domain/solo/timing/match-clock';
import {
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  saveCompletedMatch,
  getStatsCache,
  saveStatsCache,
  recalculateStats,
} from '../services/database/SoloRepository';
import {
  syncPendingMatches,
  syncActiveSessionCheckpoint,
  clearRemoteActiveSession,
} from '../services/sync/solo-sync.service';
import { generateMatchSeed } from '../domain/solo/engine/seeded-random';
import { generateId } from '../utils/uuid.utils';

// ─── Estado del store ─────────────────────────────────────────────────────────

type SoloPhase =
  | 'idle'
  | 'preparing'        // generando tablero y primera pista
  | 'showing_clue'     // medium acaba de dar la pista
  | 'selecting'        // intérprete elige cartas
  | 'showing_result'   // mostrando overlay de resultado de selección
  | 'completed';       // ritual terminado

interface SoloGameState {
  // ── Sesión ──
  session:     SoloGameSession | null;
  phase:       SoloPhase;
  currentClue: ActiveMediumClue | null;
  lastResult:  'correct' | 'neutral' | 'rival' | 'cursed' | 'wrong_own' | null;
  isPaused:    boolean;
  isSaving:    boolean;
  error:       string | null;

  // ── Estadísticas locales cacheadas ──
  stats: SoloStatsSummary | null;

  // ── Acciones ──
  startGame:       (input: StartSoloInput) => Promise<void>;
  selectCard:      (cellId: string) => Promise<'correct' | 'neutral' | 'rival' | 'cursed' | 'wrong_own' | 'ignored'>;
  continueTurn:    () => void;
  pauseGame:       () => void;
  resumeGame:      () => void;
  finishGame:      () => Promise<void>;
  restoreSession:  (uid: string) => Promise<boolean>;
  loadStats:       (uid: string) => Promise<void>;
  reset:           () => void;
}

// ─── Clock en memoria (no serializado en Zustand) ─────────────────────────────
// Se recrea al restaurar sesión desde el snapshot del store.
let _clock: MatchClock | null = null;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSoloGameStore = create<SoloGameState>((set, get) => ({
  session:     null,
  phase:       'idle',
  currentClue: null,
  lastResult:  null,
  isPaused:    false,
  isSaving:    false,
  error:       null,
  stats:       null,

  // ── Iniciar nueva partida ─────────────────────────────────────────────────

  startGame: async (input: StartSoloInput) => {
    set({ phase: 'preparing', error: null });
    try {
      const diffCfg    = DIFFICULTY_CONFIGS[input.difficulty];
      const wordLevel  = SOLO_TO_WORD_DIFFICULTY[input.difficulty];
      const seed       = generateMatchSeed(input.uid);
      const sessionId  = generateId();

      // Tablero determinista
      const board = await generateBoardWithSeed(
        {
          difficulty:             wordLevel,
          mediumTimeSeconds:      null,
          interpreterTimeSeconds: null,
          firstTeam:              input.team,
          soundEnabled:           false,
          hapticsEnabled:         false,
        },
        seed,
      );

      // Clock arranca desde cero
      _clock = new MatchClock();

      const session: SoloGameSession = {
        sessionId,
        uid:            input.uid,
        team:           input.team,
        difficulty:     input.difficulty,
        seed,
        board,
        turns:          [],
        currentTurn:    null,
        clueHistory:    emptyClueHistory(),
        runningScore:   0,
        consecutiveCorrect: 0,
        startedAt:      _clock.snapshot().startedAt,
        activeDurationMs: 0,
        lastCheckpointAt: Date.now(),
        engineVersion:  '1.0.0',
        wordPackVersion: '1.0.0',
      };

      // Primera pista del Medium
      const rng   = new (await import('../domain/solo/engine/seeded-random')).SeededRandom(seed);
      const clue  = createActiveMediumClue(
        generateClue(board, input.team, diffCfg, rng, session.clueHistory),
        1,
      );
      const turn  = buildTurn(session, clue);
      session.currentTurn = turn;
      session.clueHistory = updateClueHistory(session.clueHistory, clue);

      await saveActiveSession(session);

      set({
        session,
        phase:       'showing_clue',
        currentClue: clue,
        lastResult:  null,
        isPaused:    false,
      });
    } catch (err) {
      set({ phase: 'idle', error: err instanceof Error ? err.message : 'Error al iniciar el ritual.' });
    }
  },

  // ── Seleccionar carta ────────────────────────────────────────────────────

  selectCard: async (cellId: string) => {
    const { session, phase, currentClue } = get();
    if (!session || phase !== 'selecting' || !currentClue) return 'ignored';

    const cell = session.board.find(c => c.id === cellId);
    if (!cell || cell.state === 'REVEALED') return 'ignored';

    const result = classifySelection(cell, session.team, currentClue);
    const isCorrectTarget = result === 'correct';
    const updatedClue = registerSelection(
      currentClue,
      cellId,
      isCorrectTarget,
      result === 'cursed' ? 'failed' : result === 'correct' ? undefined : 'failed',
    );

    // Revelar carta
    const updatedBoard = session.board.map(c =>
      c.id === cellId ? { ...c, state: 'REVEALED' as const } : c
    );

    // Actualizar turno
    const currentTurn = session.currentTurn!;
    const updatedTurn: SoloTurn = {
      ...currentTurn,
      clue: updatedClue,
      selections: [
        ...currentTurn.selections,
        {
          cellId,
          word:   cell.word,
          result,
          timestamp: Date.now(),
        },
      ],
    };

    // Actualizar racha
    const newStreak = result === 'correct'
      ? session.consecutiveCorrect + 1
      : 0;

    // Score en vivo: se recalcula con el MISMO método agregado que finishGame
    // (no se acumula un "score parcial" por selección) para que el HUD
    // muestre siempre el puntaje real que se guardaría si la partida
    // terminara en este momento.
    const allTurnsSoFar = [...session.turns, updatedTurn];
    const counts = aggregateSelectionCounts(allTurnsSoFar);
    const liveScore = calculateSoloScore({
      ...counts,
      totalOwnWords:        session.board.filter(c => c.owner === session.team).length,
      activeDurationMs:     _clock?.getActiveDurationMs() ?? 0,
      interpreterTimeLimitMs: null,
      difficultyMultiplier: DIFFICULTY_CONFIGS[session.difficulty].scoreMultiplier,
      consecutiveCorrectStreak: newStreak,
    });

    const updatedSession: SoloGameSession = {
      ...session,
      board:          updatedBoard,
      currentTurn:    updatedTurn,
      runningScore:   liveScore.finalScore,
      consecutiveCorrect: newStreak,
      activeDurationMs:   _clock?.getActiveDurationMs() ?? 0,
    };

    // Checkpoint cada selección
    if (_clock) updatedSession.lastCheckpointAt = _clock.checkpoint().lastCheckpointAt;

    await saveActiveSession(updatedSession);
    // Checkpoint remoto en segundo plano (no bloquea)
    syncActiveSessionCheckpoint(updatedSession, false).catch(() => {});

    set({
      session:    updatedSession,
      currentClue: updatedClue,
      phase:      'showing_result',
      lastResult: result,
    });

    return result;
  },

  // ── Continuar después del overlay de resultado ───────────────────────────

  continueTurn: () => {
    const { session, lastResult } = get();
    if (!session) return;

    const isTerminal = lastResult === 'cursed' || lastResult === 'rival' || lastResult === 'neutral' || lastResult === 'wrong_own';
    const clue       = session.currentTurn?.clue;
    const allOwnFound     = session.board.filter(c => c.owner === session.team && c.state === 'HIDDEN').length === 0;

    if (allOwnFound || lastResult === 'cursed') {
      // Partida terminada
      get().finishGame();
      return;
    }

    if (isTerminal || !clue || clueCompleted(clue) || clueSelectionLimitReached(clue)) {
      // Nuevo turno: nueva pista del Medium
      _newTurn(set, get);
    } else {
      // Sigue el mismo turno
      set({ phase: 'selecting', lastResult: null });
    }
  },

  // ── Pausar / Reanudar ────────────────────────────────────────────────────

  pauseGame: () => {
    _clock?.pause();
    set({ isPaused: true });
  },

  resumeGame: () => {
    _clock?.resume();
    set({ isPaused: false });
  },

  // ── Finalizar partida ────────────────────────────────────────────────────

  finishGame: async () => {
    const { session, lastResult } = get();
    if (!session) return;

    _clock?.pause();
    set({ isSaving: true, phase: 'completed' });

    try {
      const clockSnap = _clock?.snapshot() ?? defaultClockSnap(session.startedAt);
      const board     = session.board;
      const team      = session.team;

      const allTurns = [
        ...(session.turns),
        ...(session.currentTurn ? [session.currentTurn] : []),
      ];

      // Los conteos para el puntaje se derivan del HISTORIAL de selecciones,
      // no del estado final del tablero: el tablero solo registra
      // owner+REVEALED, que no distingue una carta propia revelada por
      // acierto ('correct') de una revelada por error de pista ('wrong_own')
      // — ambas quedan owner===team. Derivarlo del tablero absorbía los
      // wrong_own dentro de correctSelections (sin penalizar el error) y
      // además dejaba rivalSelections y wrongSelections con el mismo
      // predicado (cartas rivales reveladas), contando ese error dos veces.
      const {
        correctSelections,
        wrongSelections,
        neutralSelections,
        rivalSelections,
        cursedSelected,
      } = aggregateSelectionCounts(allTurns);
      const totalOwnWords = board.filter(c => c.owner === team).length;

      // Total de palabras propias reveladas (por acierto o por error de
      // pista) — es lo que determina si el ritual se completó, y lo que se
      // muestra como "almas liberadas"; no depende de si cada revelación
      // coincidió con la pista vigente en ese momento.
      const ownWordsRevealed = board.filter(c => c.owner === team && c.state === 'REVEALED').length;

      const score = calculateSoloScore({
        correctSelections,
        wrongSelections,
        neutralSelections,
        rivalSelections,
        cursedSelected,
        totalOwnWords,
        activeDurationMs:       clockSnap.activeDurationMs,
        interpreterTimeLimitMs: null,
        difficultyMultiplier:   DIFFICULTY_CONFIGS[session.difficulty].scoreMultiplier,
        consecutiveCorrectStreak: session.consecutiveCorrect,
      });

      const status = cursedSelected ? 'lost_curse'
        : ownWordsRevealed === totalOwnWords ? 'won'
        : 'abandoned';

      const maxStreak = allTurns.reduce((max, t) => {
        let streak = 0, best = 0;
        for (const s of t.selections) {
          if (s.result === 'correct') { streak++; best = Math.max(best, streak); }
          else streak = 0;
        }
        return Math.max(max, best);
      }, 0);

      const match: CompletedSoloMatch = {
        matchId:        generateId(),
        uid:            session.uid,
        sessionId:      session.sessionId,
        team,
        difficulty:     session.difficulty,
        seed:           session.seed,
        wordPackVersion: session.wordPackVersion,
        engineVersion:  session.engineVersion,
        score,
        result: {
          status,
          accuracy:           score.accuracy,
          correctSelections,
          wrongSelections,
          neutralSelections,
          rivalSelections,
          cursedSelected,
          totalOwnWords,
          foundOwnWords:      ownWordsRevealed,
          maxCorrectStreak:   maxStreak,
          turnsPlayed:        allTurns.length,
        },
        timing: {
          startedAtClient:  session.startedAt,
          endedAtClient:    Date.now(),
          activeDurationMs: clockSnap.activeDurationMs,
          pausedDurationMs: clockSnap.pausedDurationMs,
        },
        turns:       allTurns,
        syncStatus:  'pending',
        createdAt:   Date.now(),
      };

      await saveCompletedMatch(match);
      await clearActiveSession(session.uid);

      // Actualizar stats locales
      const updatedStats = await recalculateStats(session.uid);
      await saveStatsCache(session.uid, updatedStats);

      set({ isSaving: false, stats: updatedStats });

      // Sincronizar en segundo plano (sin bloquear UI)
      clearRemoteActiveSession(session.uid).catch(() => {});
      syncPendingMatches(session.uid).catch(() => {});
    } catch (err) {
      set({
        isSaving: false,
        error: err instanceof Error ? err.message : 'Error al guardar el ritual.',
      });
    }
  },

  // ── Restaurar sesión ─────────────────────────────────────────────────────

  restoreSession: async (uid: string) => {
    const session = await getActiveSession(uid);
    if (!session) return false;
    const hydratedSession: SoloGameSession = {
      ...session,
      clueHistory: session.clueHistory ?? emptyClueHistory(),
      currentTurn: session.currentTurn
        ? { ...session.currentTurn, clue: hydrateActiveClue(session.currentTurn.clue, session.currentTurn.turnNumber) }
        : null,
    };

    // Recrear el clock ya corriendo: la pantalla que llama a restoreSession
    // está en foreground jugando activamente. Si se dejaba isPaused:true
    // aquí, el reloj quedaba congelado para siempre salvo que el usuario
    // llevara la app a segundo plano y volviera (único disparador de
    // resumeGame() vía el listener de AppState) — el tiempo activo tras
    // restaurar simplemente no se contaba.
    _clock = new MatchClock({
      startedAt:       hydratedSession.startedAt,
      activeDurationMs: hydratedSession.activeDurationMs,
      pausedDurationMs: 0,
      isPaused:        false,
      lastCheckpointAt: hydratedSession.lastCheckpointAt,
    });

    const clue = hydratedSession.currentTurn?.clue ?? null;

    set({
      session: hydratedSession,
      phase:       clue ? 'showing_clue' : 'selecting',
      currentClue: clue,
      isPaused:    false,
      lastResult:  null,
    });

    return true;
  },

  // ── Cargar estadísticas ──────────────────────────────────────────────────

  loadStats: async (uid: string) => {
    const cached = await getStatsCache(uid);
    if (cached) {
      set({ stats: cached });
    } else {
      const computed = await recalculateStats(uid);
      await saveStatsCache(uid, computed);
      set({ stats: computed });
    }
  },

  // ── Reset ────────────────────────────────────────────────────────────────

  reset: () => {
    _clock = null;
    set({
      session:     null,
      phase:       'idle',
      currentClue: null,
      lastResult:  null,
      isPaused:    false,
      isSaving:    false,
      error:       null,
    });
  },
}));

// ─── Helpers internos ─────────────────────────────────────────────────────────

function classifySelection(
  cell: BoardCell,
  userTeam: TeamColor,
  clue: ActiveMediumClue,
): 'correct' | 'neutral' | 'rival' | 'cursed' | 'wrong_own' {
  if (cell.owner === 'CURSED')  return 'cursed';
  if (cell.owner === 'NEUTRAL') return 'neutral';
  if (cell.owner === userTeam) {
    return clue.remainingTargetWordIds.includes(cell.id) ? 'correct' : 'wrong_own';
  }
  return 'rival';
}

/** Agrega los resultados de selección de todos los turnos (jugados + en curso). */
function aggregateSelectionCounts(allTurns: SoloTurn[]) {
  const allSelections = allTurns.flatMap(t => t.selections);
  return {
    correctSelections: allSelections.filter(s => s.result === 'correct').length,
    wrongSelections:   allSelections.filter(s => s.result === 'wrong_own').length,
    neutralSelections: allSelections.filter(s => s.result === 'neutral').length,
    rivalSelections:   allSelections.filter(s => s.result === 'rival').length,
    cursedSelected:    allSelections.some(s => s.result === 'cursed'),
  };
}

function buildTurn(session: SoloGameSession, clue: ActiveMediumClue): SoloTurn {
  return {
    turnNumber: session.turns.length + 1,
    clue,
    selections: [],
    startedAt:  Date.now(),
  };
}

function hydrateActiveClue(clue: ActiveMediumClue, turnNumber: number): ActiveMediumClue {
  if (typeof clue.remainingCount === 'number' && Array.isArray(clue.remainingTargetWordIds)) {
    return clue;
  }
  return createActiveMediumClue(clue, turnNumber);
}

async function _newTurn(
  set: (s: Partial<SoloGameState>) => void,
  get: () => SoloGameState,
): Promise<void> {
  const { session } = get();
  if (!session) return;

  const diffCfg = DIFFICULTY_CONFIGS[session.difficulty];
  const { SeededRandom } = await import('../domain/solo/engine/seeded-random');
  const rng  = new SeededRandom(`${session.seed}-turn-${session.turns.length + 1}`);
  const history = session.clueHistory ?? emptyClueHistory();
  const nextTurnNumber = session.turns.length + (session.currentTurn ? 2 : 1);
  const clue = createActiveMediumClue(
    generateClue(session.board, session.team, diffCfg, rng, history),
    nextTurnNumber,
  );

  const closedTurn = session.currentTurn
    ? { ...session.currentTurn, endedAt: Date.now() } as SoloTurn
    : null;

  const newTurn = buildTurn(
    { ...session, turns: closedTurn ? [...session.turns, closedTurn] : session.turns },
    clue,
  );

  const updatedSession: SoloGameSession = {
    ...session,
    turns:       closedTurn ? [...session.turns, closedTurn] : session.turns,
    currentTurn: newTurn,
    clueHistory: updateClueHistory(history, clue),
  };

  await saveActiveSession(updatedSession);

  set({
    session:     updatedSession,
    phase:       'showing_clue',
    currentClue: clue,
    lastResult:  null,
  });
}

function defaultClockSnap(startedAt: number) {
  return {
    startedAt,
    activeDurationMs: Date.now() - startedAt,
    pausedDurationMs: 0,
    isPaused:         false,
    lastCheckpointAt: Date.now(),
  };
}
