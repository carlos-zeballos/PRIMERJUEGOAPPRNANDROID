/**
 * Wrappers sobre los utilitarios existentes de string.
 * El motor del Medium importa desde aquí para mantener
 * una capa de abstracción sobre la implementación.
 */

import { normalize, extractRoot, isMorphologicalVariant } from '../../../utils/string.utils';

export { normalize, extractRoot, isMorphologicalVariant };

/**
 * Verifica si una palabra candidata a pista está en el tablero
 * o es una variante morfológica obvia de alguna palabra del tablero.
 */
export function isForbiddenClue(
  candidate: string,
  boardWords: string[],
  extraForbidden: string[] = [],
): boolean {
  const candidateNorm = normalize(candidate);

  // Coincidencia exacta con alguna palabra del tablero
  for (const bw of boardWords) {
    if (normalize(bw) === candidateNorm) return true;
  }

  // Variante morfológica de alguna palabra del tablero
  for (const bw of boardWords) {
    if (isMorphologicalVariant(candidate, bw)) return true;
  }

  // Lista explícita de pistas prohibidas
  for (const f of extraForbidden) {
    if (normalize(f) === candidateNorm) return true;
    if (isMorphologicalVariant(candidate, f)) return true;
  }

  return false;
}

/**
 * Verifica si dos palabras comparten raíz morfológica.
 * Usado para medir si una pista es "demasiado directa".
 */
export function shareRoot(a: string, b: string): boolean {
  return extractRoot(normalize(a)) === extractRoot(normalize(b));
}
