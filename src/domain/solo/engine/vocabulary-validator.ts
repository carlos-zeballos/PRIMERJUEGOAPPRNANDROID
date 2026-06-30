import { SemanticEntry, SoloDifficultyId } from '../types/solo.types';
import { normalize } from './word-normalizer';

export interface VocabularyValidationResult {
  valid: boolean;
  reasons: string[];
}

export interface WordEntry extends SemanticEntry {
  id: string;
  text: string;
  language: 'es';
  allowedDifficulties: SoloDifficultyId[];
}

export const VOCABULARY_CONFIG: Record<SoloDifficultyId, {
  minimumCommonness: number;
  minimumFamiliarity: number;
  maximumTechnicality: number;
  maximumRegionality: number;
}> = {
  apprentice: { minimumCommonness: 0.85, minimumFamiliarity: 0.90, maximumTechnicality: 0.05, maximumRegionality: 0.05 },
  initiated: { minimumCommonness: 0.75, minimumFamiliarity: 0.85, maximumTechnicality: 0.08, maximumRegionality: 0.08 },
  medium: { minimumCommonness: 0.65, minimumFamiliarity: 0.80, maximumTechnicality: 0.10, maximumRegionality: 0.10 },
  nightmare: { minimumCommonness: 0.55, minimumFamiliarity: 0.75, maximumTechnicality: 0.10, maximumRegionality: 0.10 },
  hell: { minimumCommonness: 0.45, minimumFamiliarity: 0.70, maximumTechnicality: 0.10, maximumRegionality: 0.10 },
};

const NON_SPANISH_OR_OBSCURE = new Set([
  'shard', 'wraith', 'banshee', 'daemon', 'eldritch', 'entropy', 'fluxus', 'initium',
  'dissonantia', 'grimoire', 'logomancy', 'mythopoeia', 'mimicry', 'unheimlich',
  'vorticism', 'simulacrum', 'eidolon', 'ekpyrosis', 'kabbalah', 'kakodemon',
  'yaldabaoth', 'yetzer hara', 'zyxomma', 'zeitgeist', 'weltanschauung',
]);

const TECHNICAL_OR_SPECIALIZED = new Set([
  'mitocondria', 'entalpia', 'epistemologia', 'ontologia', 'sinapsis dopaminergica',
  'criptografia asimetrica', 'jurisprudencia', 'estequiometria', 'metacognicion',
  'deontologia', 'logocentrismo', 'panpsiquismo', 'noumeno', 'apofatismo',
  'panteismo', 'pragmatismo', 'alotropia', 'catalisis', 'osmosis', 'electrolisis',
  'ionizacion', 'polimorfismo', 'metempsicosis', 'palingenesia', 'hierofania',
  'psicopompo', 'katabasis', 'kenosis',
]);

export function isKnownExcludedWord(text: string): boolean {
  const key = normalize(text);
  return NON_SPANISH_OR_OBSCURE.has(key) || TECHNICAL_OR_SPECIALIZED.has(key);
}

export function validateVocabularyEntry(
  word: WordEntry,
  difficulty: SoloDifficultyId,
): VocabularyValidationResult {
  const reasons: string[] = [];
  const cfg = VOCABULARY_CONFIG[difficulty];
  const key = normalize(word.text);

  if (word.language !== 'es') reasons.push('language_not_es');
  if (word.globallyUnderstood === false) reasons.push('not_globally_understood');
  if (word.allowedAsBoardWord === false && word.allowedAsClue === false) reasons.push('not_allowed');
  if (word.allowedDifficulties.length > 0 && !word.allowedDifficulties.includes(difficulty)) reasons.push('difficulty_not_allowed');
  if (/\d/.test(word.text)) reasons.push('contains_number');
  if (/[A-Z]{2,}/.test(word.text) && word.text === word.text.toUpperCase() && word.text.length <= 4) reasons.push('possible_abbreviation');
  if (isKnownExcludedWord(key)) reasons.push('excluded_word');

  const commonness = word.commonness ?? 0;
  const familiarity = word.familiarity ?? commonness;
  const technicality = word.technicality ?? 0;
  const regionality = word.regionality ?? 0;

  if (commonness < cfg.minimumCommonness) reasons.push('low_commonness');
  if (familiarity < cfg.minimumFamiliarity) reasons.push('low_familiarity');
  if (technicality > cfg.maximumTechnicality) reasons.push('technical');
  if (regionality > cfg.maximumRegionality) reasons.push('regional');

  return { valid: reasons.length === 0, reasons };
}
