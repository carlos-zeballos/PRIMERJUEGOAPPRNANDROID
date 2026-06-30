import { ScoreConfig } from '../types/solo.types';

export const SCORE_CONFIG: ScoreConfig = {
  /** Puntos por cada palabra propia acertada */
  correctWord: 100,
  /** Bonus por cada acierto consecutivo (acumulativo por racha) */
  consecutiveCorrectBonus: 25,
  /** Penalización por palabra neutral seleccionada */
  neutralPenalty: 100,
  /** Penalización por palabra rival seleccionada */
  rivalPenalty: 200,
  /** Penalización máxima por Palabra Maldita (suele terminar el ritual) */
  cursedPenalty: 500,
  /** Bonus por ritual perfecto (ningún error, ningún neutral) */
  perfectRitualBonus: 750,
  /** Bonus máximo por tiempo (se aplica proporcionalmente al tiempo sobrante) */
  maximumTimeBonus: 500,
  /** Precisión mínima para recibir bonus de precisión (0-1) */
  accuracyBonusThreshold: 0.8,
  /** Puntos del bonus de precisión */
  accuracyBonusAmount: 200,
} as const;
