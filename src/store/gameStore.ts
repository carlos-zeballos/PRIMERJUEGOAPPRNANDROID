import { create } from 'zustand';
import { GameConfig, GameSession, GameState, TeamColor, Whisper } from '../types/game.types';
import { generateBoard } from '../services/game/BoardGenerator';
import { createNewTurn, processCellSelection, passVoluntarily } from '../services/game/TurnManager';
import { saveGameSession } from '../services/database/GameRepository';
import { syncGameSession } from '../services/firebase/firestore';
import { getCurrentUser } from '../services/firebase/auth';
import { seedWords } from '../../database/migrations/002_seed_words';
import { generateId } from '../utils/uuid.utils';

function getTeamTotals(firstTeam: TeamColor) {
  return firstTeam === 'BLUE'
    ? { blueTotal: 9, redTotal: 8 }
    : { blueTotal: 8, redTotal: 9 };
}

function persistSession(session: GameSession) {
  // SQLite — siempre (offline-first)
  saveGameSession(session).catch(() => {});

  // Firestore — solo si la partida terminó y hay usuario autenticado
  if (session.phase === 'GAME_OVER') {
    const user = getCurrentUser();
    if (user) {
      syncGameSession(session, user.uid).catch(() => {});
    }
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

  passVoluntarily: () => {
    const { session } = get();
    if (!session || session.phase !== 'INTERPRETER_TURN') return;

    const currentTurn = session.turns[session.turns.length - 1];
    if (!currentTurn || currentTurn.attempts.length === 0) return;

    const updatedSession = passVoluntarily(session);
    persistSession(updatedSession);
    set({ session: updatedSession });
  },

  resetGame: () => {
    set({ session: null, error: null });
  },
}));
