import { ES_SEMANTIC_PACK } from '../../data/word-packs/es-semantic-v1';
import { WordDifficulty } from '../../types/game.types';
import { fisherYatesShuffle, seededShuffle } from '../../utils/array.utils';
import { normalize } from '../../utils/string.utils';
import { isKnownExcludedWord } from '../../domain/solo/engine/vocabulary-validator';

interface BoardWordCandidate {
  text: string;
  normalizedText: string;
  categories: string[];
  secondaryCategories: string[];
  commonness: number;
}

const DISPLAY_TEXT: Record<string, string> = {
  arbol: 'ARBOL',
  raiz: 'RAIZ',
  montana: 'MONTANA',
  rio: 'RIO',
  pajaro: 'PAJARO',
  aguila: 'AGUILA',
  dragon: 'DRAGON',
  murcielago: 'MURCIELAGO',
  pajaro2: 'PAJARO',
  brujula: 'BRUJULA',
  cancion: 'CANCION',
  melodia: 'MELODIA',
  corazon: 'CORAZON',
  lagrima: 'LAGRIMA',
  oceano: 'OCEANO',
  jardin: 'JARDIN',
  tunel: 'TUNEL',
  angel: 'ANGEL',
};

const DIFFICULTY_POLICY: Record<WordDifficulty, {
  minimumCommonness: number;
  maxLongWords: number;
  clusterSizes: number[];
  targetCategoryRepeats: number;
}> = {
  EASY: {
    minimumCommonness: 0.88,
    maxLongWords: 3,
    clusterSizes: [4, 4, 3, 3],
    targetCategoryRepeats: 4,
  },
  MEDIUM: {
    minimumCommonness: 0.84,
    maxLongWords: 5,
    clusterSizes: [3, 3, 3, 2],
    targetCategoryRepeats: 3,
  },
  HARD: {
    minimumCommonness: 0.78,
    maxLongWords: 7,
    clusterSizes: [2, 2, 2],
    targetCategoryRepeats: 2,
  },
  INFERNAL: {
    minimumCommonness: 0.72,
    maxLongWords: 9,
    clusterSizes: [2, 2],
    targetCategoryRepeats: 1,
  },
};

function getDisplayText(sourceText: string, normalizedText: string): string {
  return DISPLAY_TEXT[normalizedText] ?? sourceText.toUpperCase();
}

function allCandidates(difficulty: WordDifficulty): BoardWordCandidate[] {
  const policy = DIFFICULTY_POLICY[difficulty];
  const seen = new Set<string>();
  return Object.entries(ES_SEMANTIC_PACK)
    .map(([key, entry]) => ({
      text: getDisplayText(key.includes('_') ? entry.normalizedText : key, normalize(entry.normalizedText || key)),
      normalizedText: normalize(entry.normalizedText || key),
      categories: entry.categories.map(normalize),
      secondaryCategories: entry.secondaryCategories.map(normalize),
      commonness: entry.commonness,
    }))
    .filter((candidate) => {
      if (!candidate.normalizedText) return false;
      if (seen.has(candidate.normalizedText)) return false;
      if (candidate.commonness < policy.minimumCommonness) return false;
      if (candidate.normalizedText.length > 12) return false;
      if (isKnownExcludedWord(candidate.normalizedText)) return false;
      seen.add(candidate.normalizedText);
      return true;
    });
}

function categoryIndex(candidates: BoardWordCandidate[]): Map<string, BoardWordCandidate[]> {
  const index = new Map<string, BoardWordCandidate[]>();
  for (const candidate of candidates) {
    for (const category of candidate.categories) {
      if (!index.has(category)) index.set(category, []);
      index.get(category)!.push(candidate);
    }
  }
  return index;
}

function categoryRepeatScore(words: BoardWordCandidate[]): number {
  const counts = new Map<string, number>();
  for (const word of words) {
    for (const category of word.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return [...counts.values()].filter((count) => count >= 2).reduce((sum, count) => sum + count, 0);
}

function longWordCount(words: BoardWordCandidate[]): number {
  return words.filter((word) => word.normalizedText.length >= 9).length;
}

function validDistribution(words: BoardWordCandidate[], difficulty: WordDifficulty): boolean {
  const policy = DIFFICULTY_POLICY[difficulty];
  if (longWordCount(words) > policy.maxLongWords) return false;
  if (difficulty === 'EASY' || difficulty === 'MEDIUM') {
    return categoryRepeatScore(words) >= policy.targetCategoryRepeats;
  }
  if (difficulty === 'INFERNAL') {
    return categoryRepeatScore(words) <= 18;
  }
  return true;
}

function takeUnique(
  selected: BoardWordCandidate[],
  next: BoardWordCandidate[],
  max: number,
): BoardWordCandidate[] {
  const seen = new Set(selected.map((word) => word.normalizedText));
  const result = [...selected];
  for (const word of next) {
    if (result.length >= max) break;
    if (seen.has(word.normalizedText)) continue;
    seen.add(word.normalizedText);
    result.push(word);
  }
  return result;
}

function selectClusteredWords(
  candidates: BoardWordCandidate[],
  difficulty: WordDifficulty,
  shuffle: <T>(items: T[], salt?: string) => T[],
): BoardWordCandidate[] {
  const policy = DIFFICULTY_POLICY[difficulty];
  const byCategory = categoryIndex(candidates);
  const categories = shuffle([...byCategory.keys()]);
  let selected: BoardWordCandidate[] = [];

  for (let i = 0; i < categories.length && selected.length < 25; i++) {
    const size = policy.clusterSizes[i % policy.clusterSizes.length];
    const bucket = shuffle(byCategory.get(categories[i]) ?? []);
    selected = takeUnique(selected, bucket, Math.min(25, selected.length + size));
  }

  return takeUnique(selected, shuffle(candidates), 25);
}

function selectDiverseWords(
  candidates: BoardWordCandidate[],
  shuffle: <T>(items: T[], salt?: string) => T[],
): BoardWordCandidate[] {
  const shuffled = shuffle(candidates);
  const selected: BoardWordCandidate[] = [];
  const categoryUse = new Map<string, number>();

  for (const word of shuffled) {
    if (selected.length >= 25) break;
    const maxUse = Math.max(...word.categories.map((category) => categoryUse.get(category) ?? 0), 0);
    if (maxUse > 2 && selected.length < 20) continue;
    selected.push(word);
    word.categories.forEach((category) => categoryUse.set(category, (categoryUse.get(category) ?? 0) + 1));
  }

  return takeUnique(selected, shuffled, 25);
}

export function getBoardWordsForDifficulty(difficulty: WordDifficulty, seed?: string): string[] {
  const candidates = allCandidates(difficulty);
  const shuffle = <T,>(items: T[], salt = 'default') => (
    seed ? seededShuffle(items, `${seed}-${salt}`) : fisherYatesShuffle(items)
  );

  if (candidates.length < 25) {
    throw new Error(`No hay suficientes palabras comunes para generar el tablero (${candidates.length}/25).`);
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const shuffled = shuffle(candidates, `attempt-${attempt}`);
    const selected = difficulty === 'HARD' || difficulty === 'INFERNAL'
      ? selectDiverseWords(shuffled, (items, salt) => shuffle(items, `${salt}-${attempt}`))
      : selectClusteredWords(shuffled, difficulty, (items, salt) => shuffle(items, `${salt}-${attempt}`));
    if (selected.length >= 25 && validDistribution(selected, difficulty)) {
      return selected.slice(0, 25).map((word) => word.text);
    }
  }

  return shuffle(candidates, 'fallback').slice(0, 25).map((word) => word.text);
}
