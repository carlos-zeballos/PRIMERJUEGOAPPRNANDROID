import { GameConfig, WordDifficulty } from '../types/game.types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  difficulty: 'MEDIUM',
  mediumTimeSeconds: 60,
  interpreterTimeSeconds: null,
  firstTeam: 'BLUE',
  soundEnabled: true,
  hapticsEnabled: true,
};

export const DIFFICULTY_LABELS: Record<WordDifficulty, string> = {
  EASY:     'FÁCIL',
  MEDIUM:   'MEDIO',
  HARD:     'DIFÍCIL',
  INFERNAL: 'INFERNAL',
};

export const DIFFICULTY_DESCRIPTIONS: Record<WordDifficulty, string> = {
  EASY:     'Palabras cotidianas. Para iniciados.',
  MEDIUM:   'Palabras variadas. El umbral estándar.',
  HARD:     'Palabras complejas. Para veteranos.',
  INFERNAL: 'Palabras oscuras. Solo para los valientes.',
};

export const MEDIUM_TIME_OPTIONS = [null, 30, 60, 90] as const;
export const INTERPRETER_TIME_OPTIONS = [null, 60, 120, 180] as const;

export const BOARD_SIZE = 25;
export const GRID_SIZE = 5;
export const FIRST_TEAM_WORD_COUNT = 9;
export const SECOND_TEAM_WORD_COUNT = 8;
export const NEUTRAL_WORD_COUNT = 7;
export const CURSED_WORD_COUNT = 1;

export const DOUBLE_TAP_WINDOW_MS = 1500;
export const CELL_REVEAL_DURATION_MS = 600;
export const WHISPER_CHAR_DELAY_MS = 50;
export const PORTAL_TRANSITION_MS = 800;
export const DEFEAT_ANIMATION_TOTAL_MS = 2500;
