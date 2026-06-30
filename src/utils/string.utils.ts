export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractRoot(word: string): string {
  const normalized = normalize(word);
  if (normalized.length <= 4) return normalized;

  const suffixes = ['mente', 'cion', 'sion', 'oso', 'osa', 'ando', 'endo', 'ado', 'ido', 'ar', 'er', 'ir', 'es', 'os', 'as'];
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix) && normalized.length - suffix.length >= 3) {
      return normalized.slice(0, normalized.length - suffix.length);
    }
  }
  return normalized;
}

export function isMorphologicalVariant(whisper: string, boardWord: string): boolean {
  const whisperNorm = normalize(whisper);
  const wordNorm = normalize(boardWord);
  if (whisperNorm === wordNorm) return true;

  const whisperRoot = extractRoot(whisperNorm);
  const wordRoot = extractRoot(wordNorm);
  if (whisperRoot === wordRoot) return true;
  if (whisperNorm.startsWith(wordRoot) || wordNorm.startsWith(whisperRoot)) return true;
  return false;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}
