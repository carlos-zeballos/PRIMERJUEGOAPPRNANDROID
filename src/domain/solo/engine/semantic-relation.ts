import { SemanticEntry, SoloDifficultyId } from '../types/solo.types';
import { getSemanticEntry } from '../../../data/word-packs/es-semantic-v1';
import { normalize } from './word-normalizer';

export interface SemanticRelationResult {
  strength: number;
  relationType: 'category' | 'function' | 'place' | 'property' | 'context' | 'simple_metaphor' | 'general_concept';
  explanation: string;
}

function includesNorm(values: string[], value: string): boolean {
  return values.map(normalize).includes(value);
}

function shared(a: string[], b: string[]): string[] {
  const bNorm = b.map(normalize);
  return a.map(normalize).filter((item) => bNorm.includes(item));
}

export function getSemanticRelation(clueNorm: string, targetNorm: string): SemanticRelationResult {
  const clueEntry = getSemanticEntry(clueNorm);
  const targetEntry = getSemanticEntry(targetNorm);

  if (!clueEntry || !targetEntry) {
    return {
      strength: 0.05,
      relationType: 'general_concept',
      explanation: `${targetNorm} puede asociarse con ${clueNorm}.`,
    };
  }

  if (includesNorm(targetEntry.synonyms, clueNorm) || includesNorm(clueEntry.synonyms, targetNorm)) {
    return {
      strength: 0.94,
      relationType: 'general_concept',
      explanation: `${clueNorm} y ${targetNorm} tienen un significado muy cercano.`,
    };
  }

  if (includesNorm(targetEntry.relatedTerms, clueNorm)) {
    return {
      strength: 0.82,
      relationType: 'context',
      explanation: `${clueNorm} se relaciona directamente con ${targetNorm}.`,
    };
  }

  if (includesNorm(clueEntry.relatedTerms, targetNorm)) {
    return {
      strength: 0.82,
      relationType: 'context',
      explanation: `${targetNorm} se relaciona directamente con ${clueNorm}.`,
    };
  }

  const primary = shared(clueEntry.categories, targetEntry.categories);
  if (primary.length > 0) {
    return {
      strength: 0.68,
      relationType: 'category',
      explanation: `${clueNorm} y ${targetNorm} comparten la idea de ${primary[0]}.`,
    };
  }

  const mixed = [
    ...shared(clueEntry.categories, targetEntry.secondaryCategories),
    ...shared(clueEntry.secondaryCategories, targetEntry.categories),
  ];
  if (mixed.length > 0) {
    return {
      strength: 0.54,
      relationType: 'simple_metaphor',
      explanation: `${targetNorm} puede conectarse con ${clueNorm} por ${mixed[0]}.`,
    };
  }

  const secondary = shared(clueEntry.secondaryCategories, targetEntry.secondaryCategories);
  if (secondary.length > 0) {
    return {
      strength: 0.46,
      relationType: 'general_concept',
      explanation: `${clueNorm} y ${targetNorm} comparten una asociacion de ${secondary[0]}.`,
    };
  }

  return {
    strength: 0.08,
    relationType: 'general_concept',
    explanation: `${targetNorm} tiene una relacion debil con ${clueNorm}.`,
  };
}

export function getEntryCommonness(entry: SemanticEntry | null | undefined): number {
  return entry?.commonness ?? 0.5;
}

export function getEntryFamiliarity(entry: SemanticEntry | null | undefined): number {
  return entry?.familiarity ?? entry?.commonness ?? 0.5;
}

export function getEntryTechnicality(entry: SemanticEntry | null | undefined): number {
  return entry?.technicality ?? 0;
}

export function getEntryRegionality(entry: SemanticEntry | null | undefined): number {
  return entry?.regionality ?? 0;
}

export function difficultyFitBonus(difficulty: SoloDifficultyId, commonness: number): number {
  if (difficulty === 'apprentice') return commonness * 0.12;
  if (difficulty === 'hell') return (1 - Math.abs(commonness - 0.62)) * 0.08;
  return commonness * 0.08;
}
