/**
 * risk-evaluator.ts
 * Evalúa el riesgo de una pista candidata frente a palabras
 * que NO son del equipo activo (rival, neutral, maldita).
 */

import { normalize } from './word-normalizer';
import { getSemanticEntry } from '../../../data/word-packs/es-semantic-v1';

export interface RiskResult {
  rivalRisk: number;
  neutralRisk: number;
  cursedRisk: number;
  totalRisk: number;
}

/**
 * Evalúa cuánto se relaciona una pista candidata con palabras de riesgo.
 * @param clueNorm         Pista normalizada
 * @param rivalWords       Palabras normalizadas del equipo rival
 * @param neutralWords     Palabras normalizadas sin equipo
 * @param cursedWord       Palabra maldita normalizada
 */
export function evaluateRisk(
  clueNorm: string,
  rivalWords: string[],
  neutralWords: string[],
  cursedWord: string | null,
): RiskResult {
  const rivalRisk   = wordListRisk(clueNorm, rivalWords, 1.5);
  const neutralRisk = wordListRisk(clueNorm, neutralWords, 0.8);
  const cursedRisk  = cursedWord ? wordRisk(clueNorm, cursedWord) * 3.0 : 0;
  const totalRisk   = rivalRisk + neutralRisk + cursedRisk;

  return { rivalRisk, neutralRisk, cursedRisk, totalRisk };
}

function wordListRisk(clueNorm: string, words: string[], weight: number): number {
  let risk = 0;
  for (const w of words) {
    risk = Math.max(risk, wordRisk(clueNorm, w) * weight);
  }
  return Math.min(risk, 1);
}

/**
 * Riesgo entre la pista y una palabra individual.
 * Retorna un valor [0, 1] donde 1 = riesgo máximo.
 */
export function wordRisk(clueNorm: string, wordNorm: string): number {
  const clueEntry = getSemanticEntry(clueNorm);
  const wordEntry = getSemanticEntry(wordNorm);

  if (!clueEntry || !wordEntry) return 0.05; // riesgo base mínimo

  let risk = 0;

  // ¿La pista aparece en los relatedTerms de la palabra?
  if (wordEntry.relatedTerms.includes(normalize(clueNorm))) {
    risk += 0.5;
  }
  // ¿La pista es sinónimo de la palabra?
  if (wordEntry.synonyms.includes(normalize(clueNorm))) {
    risk += 0.8;
  }
  // ¿Comparten categorías primarias?
  const sharedPrimary = clueEntry.categories.filter(c =>
    wordEntry.categories.includes(c)
  ).length;
  risk += sharedPrimary * 0.2;

  // ¿Comparten categorías secundarias?
  const sharedSecondary = clueEntry.secondaryCategories.filter(c =>
    wordEntry.secondaryCategories.includes(c)
  ).length;
  risk += sharedSecondary * 0.1;

  return Math.min(risk, 1.0);
}
