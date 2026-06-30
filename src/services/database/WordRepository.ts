import { getDatabase } from './SQLiteClient';
import { Word, WordDifficulty } from '../../types/game.types';

interface WordRow {
  id: string;
  text: string;
  difficulty: string;
  category: string | null;
  language: string;
  pack_id: string | null;
  is_active: number;
  created_at: number;
}

function rowToWord(row: WordRow): Word {
  return {
    id: row.id,
    text: row.text,
    difficulty: row.difficulty as WordDifficulty,
    category: row.category ?? undefined,
    language: row.language,
    packId: row.pack_id ?? undefined,
    isActive: row.is_active === 1,
  };
}

export async function getWordsByDifficulty(difficulty: WordDifficulty, limit = 300): Promise<Word[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE difficulty = ? AND is_active = 1 AND language = ? ORDER BY RANDOM() LIMIT ?',
    [difficulty, 'es', limit]
  );
  return rows.map(rowToWord);
}

export async function getWordsCount(difficulty: WordDifficulty): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM words WHERE difficulty = ? AND is_active = 1',
    [difficulty]
  );
  return result?.count ?? 0;
}

export async function insertWords(words: Omit<Word, 'isActive'>[]): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const word of words) {
      await db.runAsync(
        'INSERT OR IGNORE INTO words (id, text, difficulty, category, language, pack_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
        [word.id, word.text, word.difficulty, word.category ?? null, word.language, word.packId ?? null, now]
      );
    }
  });
}

export async function getTotalWordCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words');
  return result?.count ?? 0;
}
