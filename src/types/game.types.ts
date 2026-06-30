export type TeamColor = 'BLUE' | 'RED';
export type CellOwner = 'BLUE' | 'RED' | 'NEUTRAL' | 'CURSED';
export type CellState = 'HIDDEN' | 'REVEALED';
export type GamePhase = 'SETUP' | 'MEDIUM_TURN' | 'INTERPRETER_TURN' | 'GAME_OVER';
export type GameResult = 'BLUE_WIN' | 'RED_WIN' | 'PENDING';
export type WordDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'INFERNAL';
export type TurnEndReason =
  | 'CORRECT_EXHAUSTED'
  | 'NEUTRAL_HIT'
  | 'ENEMY_HIT'
  | 'CURSED_HIT'
  | 'VOLUNTARY_PASS'
  | 'TIMEOUT';

export interface Word {
  id: string;
  text: string;
  difficulty: WordDifficulty;
  category?: string;
  language: string;
  packId?: string;
  isActive: boolean;
}

export interface BoardCell {
  id: string;
  position: number;
  word: string;
  owner: CellOwner;
  state: CellState;
  revealedBy?: TeamColor;
  revealedAt?: number;
}

export interface Whisper {
  id: string;
  word: string;
  number: number | 'INFINITE';
  emittedAt: number;
  emittedByTeam: TeamColor;
}

export interface TurnAttempt {
  id: string;
  turnId: string;
  cellPosition: number;
  result: 'CORRECT' | 'NEUTRAL' | 'ENEMY' | 'CURSED';
  attemptNumber: number;
  timestamp: number;
}

export interface Turn {
  id: string;
  gameId: string;
  teamColor: TeamColor;
  turnNumber: number;
  whisper: Whisper;
  attempts: TurnAttempt[];
  maxAttempts: number;
  endReason?: TurnEndReason;
  startedAt: number;
  endedAt?: number;
}

export interface GameConfig {
  difficulty: WordDifficulty;
  mediumTimeSeconds: number | null;
  interpreterTimeSeconds: number | null;
  firstTeam: TeamColor;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface GameSession {
  id: string;
  config: GameConfig;
  board: BoardCell[];
  turns: Turn[];
  currentTurnIndex: number;
  activeTeam: TeamColor;
  phase: GamePhase;
  result: GameResult;
  blueScore: number;
  redScore: number;
  blueTotal: number;
  redTotal: number;
  startedAt: number;
  endedAt?: number;
  syncedAt?: number;
}

export interface GameState {
  session: GameSession | null;
  isLoading: boolean;
  error: string | null;
  initGame: (config: GameConfig) => Promise<void>;
  submitWhisper: (word: string, number: number | 'INFINITE') => void;
  selectCell: (position: number) => TurnAttempt['result'] | 'IGNORED' | undefined;
  passVoluntarily: () => void;
  resetGame: () => void;
}
