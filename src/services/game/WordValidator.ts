import { BoardCell } from '../../types/game.types';
import { isMorphologicalVariant, normalize } from '../../utils/string.utils';

export interface WhisperValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateWhisper(
  whisper: string,
  board: BoardCell[]
): WhisperValidationResult {
  const trimmed = whisper.trim();

  if (!trimmed) {
    return { valid: false, reason: 'El susurro no puede estar vacío.' };
  }

  if (trimmed.includes(' ')) {
    return { valid: false, reason: 'El susurro debe ser una sola palabra.' };
  }

  for (const cell of board) {
    if (isMorphologicalVariant(trimmed, cell.word)) {
      return {
        valid: false,
        reason: `"${trimmed}" es demasiado similar a "${cell.word}" en el tablero.`,
      };
    }
  }

  return { valid: true };
}

export function validateWhisperNumber(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '∞' || trimmed.toUpperCase() === 'INFINITE') return true;
  const n = parseInt(trimmed, 10);
  return !isNaN(n) && n >= 0 && n <= 9;
}
