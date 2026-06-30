/**
 * PRNG determinista Mulberry32.
 * Dado el mismo seed produce siempre la misma secuencia.
 * Permite tableros reproducibles y auditables.
 */

/** Genera un número entero positivo de 32 bits desde una cadena */
function hashSeed(seed: string): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0; // unsigned 32-bit
}

export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed);
    // Warm up
    this.next();
    this.next();
  }

  /** Retorna un float [0, 1) */
  next(): number {
    this.state |= 0;
    this.state += 0x6d2b79f5;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero en [0, max) */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Selecciona un elemento aleatorio de un array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(arr.length)];
  }

  /** Fisher-Yates shuffle in place */
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/** Genera una semilla de partida usando uid + timestamp */
export function generateMatchSeed(uid: string, timestamp = Date.now()): string {
  return `${uid}-${timestamp}`;
}
