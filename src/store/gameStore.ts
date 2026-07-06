import { create } from 'zustand';
import { GameConfig, GameSession, GameState, TeamColor, Whisper } from '../types/game.types';
import { generateBoard } from '../services/game/BoardGenerator';
import { createNewTurn, processCellSelection, passVoluntarily } from '../services/game/TurnManager';
import { saveGameSession, markGameSynced } from '../services/database/GameRepository';
import { registrarPartida } from '../services/firebase/realtimeGames';
import { getCurrentUser } from '../services/firebase/auth';
import { seedWords } from '../../database/migrations/002_seed_words';
import { generateId } from '../utils/uuid.utils';

function getTeamTotals(firstTeam: TeamColor) {
  return firstTeam === 'BLUE'
    ? { blueTotal: 9, redTotal: 8 }
    : { blueTotal: 8, redTotal: 9 };
}

function persistSession(session: GameSession) {
  const user = getCurrentUser();

  // SQLite — siempre (offline-first)
  saveGameSession(session, user?.uid).catch(() => {});

  // Realtime Database — solo si la partida terminó y hay usuario autenticado.
  // Si falla (sin conexión, etc.) queda con synced_at=NULL en SQLite y
  // game-sync.service.ts la reintentará más tarde — por eso hay que marcar
  // synced_at aquí también en el camino feliz, o el reintento la duplicaría
  // (cada registrarPartida hace un push() nuevo en Realtime Database).
  if (session.phase === 'GAME_OVER' && user) {
    registrarPartida(user.uid, session)
      .then(() => markGameSynced(session.id, Date.now()))
      .catch(() => {});
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  isLoading: false,
  error: null,

  initGame: async (config: GameConfig) => {
    set({ isLoading: true, error: null });
    try {
      await seedWords();

      const firstTeam: TeamColor =
        config.firstTeam === 'BLUE' ? 'BLUE'
        : config.firstTeam === 'RED' ? 'RED'
        : Math.random() < 0.5 ? 'BLUE' : 'RED';

      const resolvedConfig: GameConfig = { ...config, firstTeam };
      const board = await generateBoard(resolvedConfig);
      const { blueTotal, redTotal } = getTeamTotals(firstTeam);

      const session: GameSession = {
        id: generateId(),
        config: resolvedConfig,
        board,
        turns: [],
        currentTurnIndex: 0,
        activeTeam: firstTeam,
        phase: 'MEDIUM_TURN',
        result: 'PENDING',
        blueScore: 0,
        redScore: 0,
        blueTotal,
        redTotal,
        startedAt: Date.now(),
      };

      persistSession(session);
      set({ session, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar el juego.';
      set({ error: message, isLoading: false });
    }
  },

  submitWhisper: (word: string, number: number | 'INFINITE') => {
    const { session } = get();
    if (!session || session.phase !== 'MEDIUM_TURN') return;

    const whisper: Whisper = {
      id: generateId(),
      word: word.toUpperCase().trim(),
      number,
      emittedAt: Date.now(),
      emittedByTeam: session.activeTeam,
    };

    const turn = createNewTurn(session.id, session.activeTeam, session.turns.length + 1, whisper);
    const updatedSession: GameSession = {
      ...session,
      turns: [...session.turns, turn],
      phase: 'INTERPRETER_TURN',
    };

    persistSession(updatedSession);
    set({ session: updatedSession });
  },

  selectCell: (position: number) => {
    const { session } = get();
    if (!session || session.phase !== 'INTERPRETER_TURN') return undefined;
    if (!Number.isInteger(position)) return 'IGNORED';

    const cell = session.board[position];
    if (!cell || cell.state === 'REVEALED') return 'IGNORED';

    const { session: updatedSession, attemptResult } = processCellSelection(session, position);
    persistSession(updatedSession);
    set({ session: updatedSession });
    return attemptResult;
  },

  passVoluntarily: (force = false) => {
    const { session } = get();
    if (!session || session.phase !== 'INTERPRETER_TURN') return;

    const currentTurn = session.turns[session.turns.length - 1];
    // El botón "TERMINAR MI TURNO" solo se habilita tras al menos un intento;
    // un timeout (force=true) debe cerrar el turno igual aunque el equipo
    // no haya llegado a elegir ninguna carta.
    if (!currentTurn || (!force && currentTurn.attempts.length === 0)) return;

    const updatedSession = passVoluntarily(session);
    persistSession(updatedSession);
    set({ session: updatedSession });
  },

  skipMediumTurn: () => {
    const { session } = get();
    if (!session || session.phase !== 'MEDIUM_TURN') return;

    // El Medium no dio una pista a tiempo: se pierde el turno y pasa
    // directamente al Medium del equipo rival (no existe un Turn sin
    // whisper en el modelo de datos, así que no se registra intento).
    const updatedSession: GameSession = {
      ...session,
      activeTeam: session.activeTeam === 'BLUE' ? 'RED' : 'BLUE',
    };
    persistSession(updatedSession);
    set({ session: updatedSession });
  },

  resetGame: () => {
    set({ session: null, error: null });
  },
}));
