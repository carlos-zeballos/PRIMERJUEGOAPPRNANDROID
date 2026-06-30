/**
 * solo.types.ts
 * Tipos del modo Ritual Solitario.
 * La máquina actúa como Medium; el usuario es siempre el Intérprete.
 */

import { TeamColor, BoardCell, WordDifficulty } from '../../../types/game.types';

// ─── Identificadores ──────────────────────────────────────────────────────────

export type SoloDifficultyId =
  | 'apprentice'
  | 'initiated'
  | 'medium'
  | 'nightmare'
  | 'hell';

export type SoloStatus =
  | 'won'        // usuario encontró todas sus palabras
  | 'lost_curse' // activó la Palabra Maldita
  | 'abandoned'; // salió sin terminar

export type SyncStatus =
  | 'local_only'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed';

// ─── Entrada semántica de palabra ─────────────────────────────────────────────

export interface SemanticEntry {
  /** Texto normalizado (lowercase, sin tildes) */
  normalizedText: string;
  /** Qué tan común es la palabra (0-1). Mayor = más común */
  commonness: number;
  /** Nivel de formalidad (0 = coloquial, 1 = culto) */
  formality: number;
  /** Categorías principales (p.ej. 'agua', 'naturaleza') */
  categories: string[];
  /** Categorías secundarias o metafóricas */
  secondaryCategories: string[];
  /** Sinónimos cercanos */
  synonyms: string[];
  /** Términos relacionados (no necesariamente sinónimos) */
  relatedTerms: string[];
  /** Pistas prohibidas: variantes morfológicas obvias, etc. */
  forbiddenClues: string[];
  technicality?: number;
  regionality?: number;
  familiarity?: number;
  abstraction?: number;
  globallyUnderstood?: boolean;
  allowedAsBoardWord?: boolean;
  allowedAsClue?: boolean;
}

// ─── Pista del Medium ─────────────────────────────────────────────────────────

export interface MediumClue {
  clueId?: string;
  /** La palabra pista */
  clue: string;
  /** Cantidad de palabras objetivo que cubre */
  count: number;
  /** IDs de celdas objetivo */
  targetCellIds: string[];
  /** Explicación para mostrar AL TERMINAR el ritual */
  explanation: Array<{
    cellId: string;
    word: string;
    relation: string;
  }>;
  /** Confianza del motor (0-1) */
  confidence: number;
  /** Puntuación de riesgo (menor = más seguro) */
  riskScore: number;
  /** Versión del motor que generó la pista */
  engineVersion: string;
}

export type ActiveMediumClueStatus =
  | 'active'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'expired';

export interface ClueExplanation {
  clueId: string;
  targetWordId: string;
  relationType:
    | 'category'
    | 'function'
    | 'place'
    | 'property'
    | 'context'
    | 'simple_metaphor'
    | 'general_concept';
  text: string;
  strength: number;
}

export interface ActiveMediumClue extends MediumClue {
  clueId: string;
  originalCount: number;
  remainingCount: number;
  originalTargetWordIds: string[];
  remainingTargetWordIds: string[];
  discoveredTargetWordIds: string[];
  maximumSelections: number;
  selectionsUsed: number;
  status: ActiveMediumClueStatus;
  generatedAtTurn: number;
  explanations: ClueExplanation[];
}

export interface ClueHistory {
  usedClues: string[];
  usedFamilies: string[];
  usedCombinations: string[];
  recentTargetWordIds: string[];
  clueFrequency: Record<string, number>;
}

// ─── Configuración de dificultad ─────────────────────────────────────────────

export interface UnlockRequirement {
  /** ¿Disponible sin requisitos? */
  unlockedByDefault: boolean;
  /** Victorias requeridas en la dificultad ANTERIOR */
  requiredWinsInPreviousLevel?: number;
  /** Precisión media mínima en la dificultad anterior (0-1) */
  minimumAverageAccuracy?: number;
}

export interface DifficultyConfig {
  id: SoloDifficultyId;
  /** Nombre visible en la UI */
  label: string;
  /** Descripción visible en la UI */
  description: string;
  /** Mínimo de palabras objetivo por turno */
  minTargetWords: number;
  /** Máximo de palabras objetivo por turno */
  maxTargetWords: number;
  preferredTargetSizes?: number[];
  minimumIndividualRelation?: number;
  maximumRivalRisk?: number;
  maximumNeutralRisk?: number;
  maximumCursedRisk?: number;
  maximumAbstraction?: number;
  minimumCommonness?: number;
  minimumFamiliarity?: number;
  maximumTechnicality?: number;
  maximumRegionality?: number;
  allowSecondaryRelations?: boolean;
  allowSimpleMetaphors?: boolean;
  /** Fuerza mínima de relación para incluir un candidato */
  minimumRelationStrength: number;
  /** Riesgo máximo permitido para una pista */
  maximumRisk: number;
  /** Peso de categorías principales (0-1) */
  primaryCategoryWeight: number;
  /** Peso de categorías secundarias (0-1) */
  secondaryCategoryWeight: number;
  /** Peso de vocabulario formal (0-1) */
  formalVocabularyWeight: number;
  /** Multiplicador de tiempo sobre el base */
  timeMultiplier: number;
  /** Multiplicador de puntuación */
  scoreMultiplier: number;
  /** Requisitos de desbloqueo */
  unlockRequirement: UnlockRequirement;
}

// ─── Configuración de puntuación ─────────────────────────────────────────────

export interface ScoreConfig {
  correctWord: number;
  consecutiveCorrectBonus: number;
  neutralPenalty: number;
  rivalPenalty: number;
  cursedPenalty: number;
  perfectRitualBonus: number;
  maximumTimeBonus: number;
  accuracyBonusThreshold: number;
  accuracyBonusAmount: number;
}

// ─── Input / Output del cálculo de puntuación ────────────────────────────────

export interface SoloScoreInput {
  correctSelections: number;
  wrongSelections: number;
  neutralSelections: number;
  rivalSelections: number;
  cursedSelected: boolean;
  totalOwnWords: number;
  activeDurationMs: number;
  interpreterTimeLimitMs: number | null;
  difficultyMultiplier: number;
  consecutiveCorrectStreak: number;
}

export interface SoloScoreResult {
  baseScore: number;
  timeBonus: number;
  accuracyBonus: number;
  streakBonus: number;
  penalties: number;
  difficultyMultiplier: number;
  finalScore: number;
  accuracy: number;
  isPerfect: boolean;
}

// ─── Turno del modo solitario ─────────────────────────────────────────────────

export interface SoloTurn {
  turnNumber: number;
  clue: ActiveMediumClue;
  /** Selecciones del usuario en este turno */
  selections: Array<{
    cellId: string;
    word: string;
    result: 'correct' | 'neutral' | 'rival' | 'cursed' | 'wrong_own';
    timestamp: number;
  }>;
  startedAt: number;
  endedAt?: number;
  endReason?: 'correct_exhausted' | 'wrong_hit' | 'cursed_hit' | 'timeout' | 'completed';
}

// ─── Sesión activa del modo solitario ────────────────────────────────────────

export interface SoloGameSession {
  sessionId: string;
  uid: string;
  team: TeamColor;
  difficulty: SoloDifficultyId;
  seed: string;
  board: BoardCell[];
  turns: SoloTurn[];
  currentTurn: SoloTurn | null;
  clueHistory: ClueHistory;
  /** Puntuación acumulada en tiempo real */
  runningScore: number;
  consecutiveCorrect: number;
  startedAt: number;
  activeDurationMs: number;
  lastCheckpointAt: number;
  engineVersion: string;
  wordPackVersion: string;
}

// ─── Resultado final guardado ─────────────────────────────────────────────────

export interface CompletedSoloMatch {
  matchId: string;
  uid: string;
  sessionId: string;

  team: TeamColor;
  difficulty: SoloDifficultyId;
  seed: string;
  wordPackVersion: string;
  engineVersion: string;

  score: SoloScoreResult;

  result: {
    status: SoloStatus;
    accuracy: number;
    correctSelections: number;
    wrongSelections: number;
    neutralSelections: number;
    rivalSelections: number;
    cursedSelected: boolean;
    totalOwnWords: number;
    foundOwnWords: number;
    maxCorrectStreak: number;
    turnsPlayed: number;
  };

  timing: {
    startedAtClient: number;
    endedAtClient: number;
    activeDurationMs: number;
    pausedDurationMs: number;
  };

  turns: SoloTurn[];
  syncStatus: SyncStatus;
  createdAt: number;
}

// ─── Estadísticas por dificultad ─────────────────────────────────────────────

export interface DifficultyProgress {
  difficultyId: SoloDifficultyId;
  matches: number;
  wins: number;
  losses: number;
  bestScore: number;
  totalScore: number;
  totalPlayTimeMs: number;
  averageAccuracy: number;
  perfectRituals: number;
  unlocked: boolean;
  unlockedAt: number | null;
}

// ─── Resumen global de estadísticas ──────────────────────────────────────────

export interface SoloStatsSummary {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  bestScore: number;
  totalScore: number;
  totalPlayTimeMs: number;
  totalCorrectSelections: number;
  totalWrongSelections: number;
  cursedLosses: number;
  perfectRituals: number;
  bestCorrectStreak: number;
  currentWinStreak: number;
  bestWinStreak: number;
  averageAccuracy: number;
  unlockedDifficulties: SoloDifficultyId[];
  lastPlayedAt: number | null;
  difficultyProgress: Record<SoloDifficultyId, DifficultyProgress>;
}

// ─── Estado del store Zustand (forward declaration) ──────────────────────────

export interface StartSoloInput {
  uid: string;
  team: TeamColor;
  difficulty: SoloDifficultyId;
  difficultyWordLevel: WordDifficulty;
}
