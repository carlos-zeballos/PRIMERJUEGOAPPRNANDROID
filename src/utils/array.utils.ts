import { SeededRandom } from '../domain/solo/engine/seeded-random';

/** Shuffle determinista con semilla — produce siempre la misma secuencia */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = new SeededRandom(seed);
  return rng.shuffle(array);
}

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sampleN<T>(array: T[], n: number): T[] {
  if (n >= array.length) return fisherYatesShuffle(array);
  const shuffled = fisherYatesShuffle(array);
  return shuffled.slice(0, n);
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
