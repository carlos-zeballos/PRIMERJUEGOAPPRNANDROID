/**
 * calculate-score.ts
 * Función pura de cálculo de puntuación para el modo solitario.
 * Sin efectos secundarios, sin llamadas Firebase, sin UI.
 * Fácilmente testeable de forma unitaria.
 */

import { SoloScoreInput, SoloScoreResult } from '../types/solo.types';
import { SCORE_CONFIG } from '../config/score.config';

export function calculateSoloScore(input: SoloScoreInput): SoloScoreResult {
  const {
    correctSelections,
    wrongSelections,
    neutralSelections,
    rivalSelections,
    cursedSelected,
    totalOwnWords,
    activeDurationMs,
    interpreterTimeLimitMs,
    difficultyMultiplier,
    consecutiveCorrectStreak,
  } = input;

  // ── Base ────────────────────────────────────────────────────────────────
  const baseScore = correctSelections * SCORE_CONFIG.correctWord;

  // ── Racha ────────────────────────────────────────────────────────────────
  // Bonus acumulativo por aciertos consecutivos
  const streakBonus =
    consecutiveCorrectStreak > 1
      ? (consecutiveCorrectStreak - 1) * SCORE_CONFIG.consecutiveCorrectBonus
      : 0;

  // ── Penalizaciones ───────────────────────────────────────────────────────
  const neutralPenalty   = neutralSelections  * SCORE_CONFIG.neutralPenalty;
  const rivalPenalty     = rivalSelections    * SCORE_CONFIG.rivalPenalty;
  const cursedPenaltyAmt = cursedSelected     ? SCORE_CONFIG.cursedPenalty : 0;
  const penalties        = neutralPenalty + rivalPenalty + cursedPenaltyAmt;

  // ── Ritual perfecto ──────────────────────────────────────────────────────
  const isPerfect =
    correctSelections === totalOwnWords &&
    wrongSelections === 0 &&
    neutralSelections === 0 &&
    rivalSelections === 0 &&
    !cursedSelected;
  const perfectBonus = isPerfect ? SCORE_CONFIG.perfectRitualBonus : 0;

  // ── Bonus de tiempo ──────────────────────────────────────────────────────
  let timeBonus = 0;
  if (interpreterTimeLimitMs !== null && interpreterTimeLimitMs > 0) {
    const ratio = 1 - Math.min(activeDurationMs / interpreterTimeLimitMs, 1);
    timeBonus = Math.floor(ratio * SCORE_CONFIG.maximumTimeBonus);
  }

  // ── Bonus de precisión ───────────────────────────────────────────────────
  const totalSelections = correctSelections + wrongSelections + neutralSelections + rivalSelections;
  const accuracy = totalSelections > 0 ? correctSelections / totalSelections : 0;
  const accuracyBonus =
    accuracy >= SCORE_CONFIG.accuracyBonusThreshold
      ? SCORE_CONFIG.accuracyBonusAmount
      : 0;

  // ── Total ────────────────────────────────────────────────────────────────
  const subtotal = Math.max(
    0,
    baseScore + streakBonus + timeBonus + accuracyBonus + perfectBonus - penalties,
  );
  const finalScore = Math.round(subtotal * difficultyMultiplier);

  return {
    baseScore,
    timeBonus,
    accuracyBonus: accuracyBonus + perfectBonus,
    streakBonus,
    penalties,
    difficultyMultiplier,
    finalScore,
    accuracy,
    isPerfect,
  };
}
