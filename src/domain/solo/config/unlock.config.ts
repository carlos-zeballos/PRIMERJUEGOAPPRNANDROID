import { SoloDifficultyId } from '../types/solo.types';
import { DIFFICULTY_CONFIGS } from './difficulty.config';

/**
 * Evalúa si el usuario puede desbloquear la siguiente dificultad
 * basándose en su progreso en la dificultad anterior.
 */
export function canUnlock(
  targetId: SoloDifficultyId,
  previousWins: number,
  previousAverageAccuracy: number,
): boolean {
  const cfg = DIFFICULTY_CONFIGS[targetId];
  const req = cfg.unlockRequirement;

  if (req.unlockedByDefault) return true;

  if (
    req.requiredWinsInPreviousLevel !== undefined &&
    previousWins < req.requiredWinsInPreviousLevel
  ) {
    return false;
  }

  if (
    req.minimumAverageAccuracy !== undefined &&
    previousAverageAccuracy < req.minimumAverageAccuracy
  ) {
    return false;
  }

  return true;
}

/** Texto descriptivo del requisito de desbloqueo */
export function unlockDescription(id: SoloDifficultyId): string {
  const req = DIFFICULTY_CONFIGS[id].unlockRequirement;
  if (req.unlockedByDefault) return 'Disponible desde el inicio';

  const parts: string[] = [];
  if (req.requiredWinsInPreviousLevel) {
    parts.push(`${req.requiredWinsInPreviousLevel} victorias en nivel anterior`);
  }
  if (req.minimumAverageAccuracy) {
    parts.push(`${Math.round(req.minimumAverageAccuracy * 100)}% de precisión media`);
  }
  return parts.join(' · ');
}
