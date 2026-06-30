import { BoardCell } from '../../../types/game.types';

function shareAny(a: string[], b: string[]): boolean {
  return a.some((item) => b.includes(item));
}

function relatedScore(a: BoardCell, b: BoardCell, categories: Map<string, string[]>): number {
  const ca = categories.get(a.id) ?? [];
  const cb = categories.get(b.id) ?? [];
  return shareAny(ca, cb) ? 2 : 0;
}

export function generateTargetCombinations(
  availableOwnWordIds: string[],
  sizes: number[],
  maximumCombinations: number,
  cellsById: Map<string, BoardCell> = new Map(),
  categories: Map<string, string[]> = new Map(),
): string[][] {
  const ids = [...new Set(availableOwnWordIds)].filter((id) => {
    const cell = cellsById.get(id);
    return !cell || cell.state !== 'REVEALED';
  });

  const combos: string[][] = [];

  function build(start: number, size: number, current: string[]) {
    if (combos.length >= maximumCombinations) return;
    if (current.length === size) {
      combos.push([...current]);
      return;
    }

    for (let i = start; i < ids.length; i++) {
      current.push(ids[i]);
      build(i + 1, size, current);
      current.pop();
      if (combos.length >= maximumCombinations) return;
    }
  }

  for (const size of sizes) {
    if (size < 1 || size > ids.length) continue;
    build(0, size, []);
  }

  return combos
    .map((combo) => ({
      combo,
      score: combo.reduce((sum, id, index) => {
        const a = cellsById.get(id);
        if (!a) return sum;
        return sum + combo.slice(index + 1).reduce((pairSum, otherId) => {
          const b = cellsById.get(otherId);
          return pairSum + (b ? relatedScore(a, b, categories) : 0);
        }, 0);
      }, 0),
    }))
    .sort((a, b) => b.score - a.score || b.combo.length - a.combo.length)
    .slice(0, maximumCombinations)
    .map((item) => item.combo);
}
