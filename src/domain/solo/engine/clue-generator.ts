import { BoardCell, TeamColor } from '../../../types/game.types';
import {
  ClueHistory,
  DifficultyConfig,
  MediumClue,
} from '../types/solo.types';
import {
  getSemanticEntry,
  WORD_PACK_VERSION,
} from '../../../data/word-packs/es-semantic-v1';
import { normalize, isForbiddenClue } from './word-normalizer';
import { evaluateRisk } from './risk-evaluator';
import { SeededRandom } from './seeded-random';
import { combinationKey, emptyClueHistory } from './active-clue';
import { generateTargetCombinations } from './target-combinations';
import {
  difficultyFitBonus,
  getEntryCommonness,
  getEntryFamiliarity,
  getEntryTechnicality,
  getSemanticRelation,
} from './semantic-relation';
import { isKnownExcludedWord } from './vocabulary-validator';

const ENGINE_VERSION = '2.0.0';
const MAX_COMBINATIONS = 24;
const MAX_CANDIDATES_PER_COMBO = 18;

interface CandidateScore {
  clue: string;
  targetCellIds: string[];
  averageTargetSimilarity: number;
  minimumTargetSimilarity: number;
  rivalRisk: number;
  neutralRisk: number;
  cursedRisk: number;
  finalScore: number;
  explanationQuality: number;
}

function getPreferredSizes(config: DifficultyConfig, ownCount: number): number[] {
  const order = [4, 3, 2].filter((size) => size <= ownCount && size <= config.maxTargetWords);
  return order.length > 0 ? order : [1];
}

function getMinimumIndividual(config: DifficultyConfig): number {
  return config.minimumIndividualRelation ?? Math.max(0.2, config.minimumRelationStrength - 0.05);
}

function getMultiWordBonus(targetCount: number): number {
  if (targetCount === 4) return 0.16;
  if (targetCount === 3) return 0.14;
  if (targetCount === 2) return 0.10;
  return 0;
}

function familyOf(clue: string): string {
  const entry = getSemanticEntry(clue);
  return entry?.categories[0] ?? clue.slice(0, 5);
}

function isRepeatedCombination(history: ClueHistory, ids: string[]): boolean {
  return history.usedCombinations.includes(combinationKey(ids));
}

function candidatePool(targetWords: string[], config: DifficultyConfig): string[] {
  const pool = new Set<string>();

  for (const word of targetWords) {
    const entry = getSemanticEntry(word);
    if (!entry) continue;

    [...entry.relatedTerms, ...entry.synonyms, ...entry.categories].forEach((term) => pool.add(normalize(term)));
    if (config.allowSecondaryRelations !== false) {
      entry.secondaryCategories.forEach((term) => pool.add(normalize(term)));
    }
  }

  return [...pool].slice(0, MAX_CANDIDATES_PER_COMBO * 2);
}

function validVocabularyClue(clue: string, config: DifficultyConfig): boolean {
  if (!clue || clue.length < 3) return false;
  if (isKnownExcludedWord(clue)) return false;
  if (!/^[a-záéíóúüñ\s]+$/i.test(clue)) return false;

  const entry = getSemanticEntry(clue);
  if (!entry) return true;
  if (entry.allowedAsClue === false || entry.globallyUnderstood === false) return false;
  if (getEntryCommonness(entry) < (config.minimumCommonness ?? 0.45)) return false;
  if (getEntryFamiliarity(entry) < (config.minimumFamiliarity ?? 0.7)) return false;
  if (getEntryTechnicality(entry) > (config.maximumTechnicality ?? 0.1)) return false;
  return true;
}

export function generateClue(
  board: BoardCell[],
  activeTeam: TeamColor,
  config: DifficultyConfig,
  rng: SeededRandom,
  historyInput?: ClueHistory,
): MediumClue {
  const history = historyInput ?? emptyClueHistory();
  const allWords = board.map((c) => normalize(c.word));
  const teamCells = board.filter((c) => c.owner === activeTeam && c.state === 'HIDDEN');
  const rivalCells = board.filter((c) => c.owner !== activeTeam && c.owner !== 'NEUTRAL' && c.owner !== 'CURSED' && c.state === 'HIDDEN');
  const neutralCells = board.filter((c) => c.owner === 'NEUTRAL' && c.state === 'HIDDEN');
  const cursedCell = board.find((c) => c.owner === 'CURSED' && c.state === 'HIDDEN') ?? null;

  if (teamCells.length === 0) {
    return fallbackClue(activeTeam, rng, history);
  }

  const cellsById = new Map(teamCells.map((cell) => [cell.id, cell]));
  const categoriesById = new Map(teamCells.map((cell) => {
    const entry = getSemanticEntry(normalize(cell.word));
    return [cell.id, [...(entry?.categories ?? []), ...(entry?.secondaryCategories ?? [])].map(normalize)];
  }));
  const rivalWords = rivalCells.map((c) => normalize(c.word));
  const neutralWords = neutralCells.map((c) => normalize(c.word));
  const cursedWord = cursedCell ? normalize(cursedCell.word) : null;
  const sizes = getPreferredSizes(config, teamCells.length);

  for (const size of sizes) {
    const combinations = generateTargetCombinations(
      teamCells.map((cell) => cell.id),
      [size],
      MAX_COMBINATIONS,
      cellsById,
      categoriesById,
    ).filter((combo) => !isRepeatedCombination(history, combo));

    const scored: CandidateScore[] = [];

    for (const combo of combinations) {
      const targetCells = combo.map((id) => cellsById.get(id)).filter(Boolean) as BoardCell[];
      const targetWords = targetCells.map((cell) => normalize(cell.word));
      const candidates = rng.shuffle(candidatePool(targetWords, config)).slice(0, MAX_CANDIDATES_PER_COMBO);

      for (const clue of candidates) {
        if (history.usedClues.includes(clue)) continue;
        if (history.usedFamilies[history.usedFamilies.length - 1] === familyOf(clue)) continue;
        if (isForbiddenClue(clue, allWords)) continue;
        if (!validVocabularyClue(clue, config)) continue;

        const relations = targetWords.map((word) => getSemanticRelation(clue, word));
        const similarities = relations.map((relation) => relation.strength);
        const averageTargetSimilarity = similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
        const minimumTargetSimilarity = Math.min(...similarities);

        if (averageTargetSimilarity < config.minimumRelationStrength) continue;
        if (minimumTargetSimilarity < getMinimumIndividual(config)) continue;

        const risk = evaluateRisk(clue, rivalWords, neutralWords, cursedWord);
        if (risk.rivalRisk > (config.maximumRivalRisk ?? config.maximumRisk)) continue;
        if (risk.neutralRisk > (config.maximumNeutralRisk ?? config.maximumRisk)) continue;
        if (risk.cursedRisk > (config.maximumCursedRisk ?? config.maximumRisk)) continue;
        if (risk.totalRisk > config.maximumRisk) continue;

        const entry = getSemanticEntry(clue);
        const commonnessBonus = getEntryCommonness(entry) * 0.12;
        const noveltyBonus = history.clueFrequency[clue] ? -0.4 : 0.08;
        const repeatedTargetPenalty = combo.filter((id) => history.recentTargetWordIds.includes(id)).length * 0.04;
        const explanationQuality = relations.every((relation) => relation.strength >= getMinimumIndividual(config)) ? 0.1 : -0.2;
        const preferredIndex = config.preferredTargetSizes?.indexOf(size) ?? -1;
        const preferredBonus = preferredIndex >= 0 ? (3 - preferredIndex) * 0.015 : 0;

        const finalScore =
          averageTargetSimilarity +
          minimumTargetSimilarity +
          getMultiWordBonus(size) +
          commonnessBonus +
          difficultyFitBonus(config.id, getEntryCommonness(entry)) +
          noveltyBonus +
          preferredBonus +
          explanationQuality -
          risk.rivalRisk -
          risk.neutralRisk * 0.65 -
          risk.cursedRisk -
          repeatedTargetPenalty;

        scored.push({
          clue,
          targetCellIds: combo,
          averageTargetSimilarity,
          minimumTargetSimilarity,
          rivalRisk: risk.rivalRisk,
          neutralRisk: risk.neutralRisk,
          cursedRisk: risk.cursedRisk,
          finalScore,
          explanationQuality,
        });
      }
    }

    if (scored.length > 0) {
      scored.sort((a, b) => b.finalScore - a.finalScore);
      return buildClue(weightedPick(scored.slice(0, Math.min(8, scored.length)), rng), board);
    }
  }

  return singleWordFallback(teamCells, activeTeam, allWords, rng, config, history, rivalWords, neutralWords, cursedWord);
}

function weightedPick(candidates: CandidateScore[], rng: SeededRandom): CandidateScore {
  const min = Math.min(...candidates.map((candidate) => candidate.finalScore));
  const weights = candidates.map((candidate) => Math.max(0.05, candidate.finalScore - min + 0.05));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = rng.next() * total;

  for (let i = 0; i < candidates.length; i++) {
    cursor -= weights[i];
    if (cursor <= 0) return candidates[i];
  }

  return candidates[0];
}

function buildClue(candidate: CandidateScore, board: BoardCell[]): MediumClue {
  const clueId = `${candidate.clue}-${combinationKey(candidate.targetCellIds)}`;
  const explanation = candidate.targetCellIds.map((id) => {
    const cell = board.find((c) => c.id === id)!;
    const relation = getSemanticRelation(candidate.clue, normalize(cell.word));
    return {
      cellId: id,
      word: cell.word,
      relation: relation.explanation,
    };
  });

  return {
    clueId,
    clue: candidate.clue.toUpperCase(),
    count: candidate.targetCellIds.length,
    targetCellIds: candidate.targetCellIds,
    explanation,
    confidence: Math.min(1, Math.max(0, candidate.finalScore / 2.4)),
    riskScore: candidate.rivalRisk + candidate.neutralRisk + candidate.cursedRisk,
    engineVersion: `${ENGINE_VERSION}-${WORD_PACK_VERSION}`,
  };
}

function singleWordFallback(
  teamCells: BoardCell[],
  activeTeam: TeamColor,
  allWords: string[],
  rng: SeededRandom,
  config: DifficultyConfig,
  history: ClueHistory,
  rivalWords: string[],
  neutralWords: string[],
  cursedWord: string | null,
): MediumClue {
  const shuffled = rng.shuffle(teamCells);

  for (const cell of shuffled) {
    const word = normalize(cell.word);
    const candidates = rng.shuffle(candidatePool([word], config));
    for (const clue of candidates) {
      if (history.usedClues.includes(clue)) continue;
      if (isForbiddenClue(clue, allWords)) continue;
      if (!validVocabularyClue(clue, config)) continue;
      const relation = getSemanticRelation(clue, word);
      if (relation.strength < getMinimumIndividual(config)) continue;
      const risk = evaluateRisk(clue, rivalWords, neutralWords, cursedWord);
      if (risk.totalRisk > config.maximumRisk) continue;

      return buildClue({
        clue,
        targetCellIds: [cell.id],
        averageTargetSimilarity: relation.strength,
        minimumTargetSimilarity: relation.strength,
        rivalRisk: risk.rivalRisk,
        neutralRisk: risk.neutralRisk,
        cursedRisk: risk.cursedRisk,
        finalScore: relation.strength - risk.totalRisk,
        explanationQuality: 0.1,
      }, [cell]);
    }
  }

  return fallbackClue(activeTeam, rng, history);
}

function fallbackClue(team: TeamColor, rng: SeededRandom, history: ClueHistory): MediumClue {
  const fallbacks = team === 'BLUE'
    ? ['SOMBRA', 'CAMINO', 'MISTERIO', 'REFUGIO']
    : ['FUEGO', 'NOCHE', 'PODER', 'DESTINO'];
  const available = fallbacks.filter((item) => !history.usedClues.includes(normalize(item)));
  const clue = rng.pick(available.length > 0 ? available : fallbacks);

  return {
    clueId: `${normalize(clue)}-fallback`,
    clue,
    count: 1,
    targetCellIds: [],
    explanation: [],
    confidence: 0.1,
    riskScore: 0.5,
    engineVersion: `${ENGINE_VERSION}-${WORD_PACK_VERSION}`,
  };
}
