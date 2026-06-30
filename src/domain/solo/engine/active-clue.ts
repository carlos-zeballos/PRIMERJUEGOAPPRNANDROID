import {
  ActiveMediumClue,
  ActiveMediumClueStatus,
  ClueHistory,
  MediumClue,
} from '../types/solo.types';
import { normalize } from './word-normalizer';

export function emptyClueHistory(): ClueHistory {
  return {
    usedClues: [],
    usedFamilies: [],
    usedCombinations: [],
    recentTargetWordIds: [],
    clueFrequency: {},
  };
}

export function combinationKey(ids: string[]): string {
  return [...ids].sort().join('|');
}

export function createActiveMediumClue(clue: MediumClue, generatedAtTurn: number): ActiveMediumClue {
  const originalTargetWordIds = [...clue.targetCellIds];
  const clueId = clue.clueId ?? `${normalize(clue.clue)}-${combinationKey(originalTargetWordIds)}`;

  return {
    ...clue,
    clueId,
    originalCount: originalTargetWordIds.length,
    remainingCount: originalTargetWordIds.length,
    originalTargetWordIds,
    remainingTargetWordIds: [...originalTargetWordIds],
    discoveredTargetWordIds: [],
    maximumSelections: originalTargetWordIds.length + 1,
    selectionsUsed: 0,
    status: 'active',
    generatedAtTurn,
    explanations: clue.explanation.map((item) => ({
      clueId,
      targetWordId: item.cellId,
      relationType: 'general_concept',
      text: item.relation,
      strength: clue.confidence,
    })),
  };
}

export function registerSelection(
  clue: ActiveMediumClue,
  cellId: string,
  correctTarget: boolean,
  terminalStatus?: ActiveMediumClueStatus,
): ActiveMediumClue {
  const selectionsUsed = clue.selectionsUsed + 1;

  if (!correctTarget) {
    return {
      ...clue,
      selectionsUsed,
      status: terminalStatus ?? 'failed',
    };
  }

  const remainingTargetWordIds = clue.remainingTargetWordIds.filter((id) => id !== cellId);
  const discoveredTargetWordIds = clue.discoveredTargetWordIds.includes(cellId)
    ? clue.discoveredTargetWordIds
    : [...clue.discoveredTargetWordIds, cellId];
  const remainingCount = remainingTargetWordIds.length;

  return {
    ...clue,
    remainingTargetWordIds,
    discoveredTargetWordIds,
    remainingCount,
    selectionsUsed,
    status: remainingCount === 0 ? 'completed' : 'active',
  };
}

export function clueCompleted(clue: ActiveMediumClue): boolean {
  return clue.remainingCount === 0 || clue.status === 'completed';
}

export function clueSelectionLimitReached(clue: ActiveMediumClue): boolean {
  return clue.selectionsUsed >= clue.maximumSelections;
}

export function updateClueHistory(history: ClueHistory | undefined, clue: ActiveMediumClue): ClueHistory {
  const base = history ?? emptyClueHistory();
  const clueNorm = normalize(clue.clue);
  const combo = combinationKey(clue.originalTargetWordIds);
  const family = clueNorm.split(' ')[0] || clueNorm;

  return {
    usedClues: base.usedClues.includes(clueNorm) ? base.usedClues : [...base.usedClues, clueNorm],
    usedFamilies: base.usedFamilies.includes(family) ? base.usedFamilies : [...base.usedFamilies, family],
    usedCombinations: base.usedCombinations.includes(combo) ? base.usedCombinations : [...base.usedCombinations, combo],
    recentTargetWordIds: [...clue.originalTargetWordIds, ...base.recentTargetWordIds]
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .slice(0, 18),
    clueFrequency: {
      ...base.clueFrequency,
      [clueNorm]: (base.clueFrequency[clueNorm] ?? 0) + 1,
    },
  };
}
