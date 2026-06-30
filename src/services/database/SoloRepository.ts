/**
 * SoloRepository.ts
 * Capa de acceso a datos SQLite para el modo Ritual Solitario.
 * Todos los métodos son idempotentes (INSERT OR REPLACE).
 * La sincronización con Firebase ocurre en la capa superior.
 */

import { getDatabase } from './SQLiteClient';
import {
  CompletedSoloMatch,
  SoloGameSession,
  SoloStatsSummary,
  SyncStatus,
} from '../../domain/solo/types/solo.types';

// ─── Sesión activa ────────────────────────────────────────────────────────────

/** Guarda o actualiza la sesión activa del usuario */
export async function saveActiveSession(session: SoloGameSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO solo_active_session
       (session_id, uid, payload_json, version, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      session.sessionId,
      session.uid,
      JSON.stringify(session),
      1,
      Date.now(),
      'local_only',
    ],
  );
}

/** Obtiene la sesión activa del usuario, si existe */
export async function getActiveSession(uid: string): Promise<SoloGameSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>(
    'SELECT payload_json FROM solo_active_session WHERE uid = ? LIMIT 1',
    [uid],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload_json) as SoloGameSession;
  } catch {
    return null;
  }
}

/** Elimina la sesión activa (cuando el ritual se completa o abandona) */
export async function clearActiveSession(uid: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM solo_active_session WHERE uid = ?', [uid]);
}

// ─── Partidas completadas ─────────────────────────────────────────────────────

/** Guarda una partida completada. Si ya existe, no la reemplaza (inmutable). */
export async function saveCompletedMatch(match: CompletedSoloMatch): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO solo_matches
       (match_id, uid, payload_json, difficulty, team, status,
        final_score, created_at, sync_status, retry_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      match.matchId,
      match.uid,
      JSON.stringify(match),
      match.difficulty,
      match.team,
      match.result.status,
      match.score.finalScore,
      match.createdAt,
      match.syncStatus,
      0,
    ],
  );
}

/** Actualiza el estado de sincronización de una partida */
export async function updateMatchSyncStatus(
  matchId: string,
  status: SyncStatus,
  error?: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE solo_matches
        SET sync_status = ?,
            last_sync_error = ?,
            retry_count = retry_count + ?
      WHERE match_id = ?`,
    [status, error ?? null, status === 'failed' ? 1 : 0, matchId],
  );
}

/** Devuelve partidas pendientes de sincronizar */
export async function getPendingMatches(uid: string): Promise<CompletedSoloMatch[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ payload_json: string }>(
    `SELECT payload_json FROM solo_matches
      WHERE uid = ? AND sync_status IN ('pending', 'failed') AND retry_count < 5
      ORDER BY created_at ASC`,
    [uid],
  );
  return rows.flatMap(r => {
    try { return [JSON.parse(r.payload_json) as CompletedSoloMatch]; }
    catch { return []; }
  });
}

/** Historial de partidas del usuario (paginado) */
export async function getMatchHistory(uid: string, limit = 20, offset = 0): Promise<CompletedSoloMatch[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ payload_json: string }>(
    `SELECT payload_json FROM solo_matches
      WHERE uid = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [uid, limit, offset],
  );
  return rows.flatMap(r => {
    try { return [JSON.parse(r.payload_json) as CompletedSoloMatch]; }
    catch { return []; }
  });
}

/** Verifica si una partida ya existe (para evitar duplicados) */
export async function matchExists(matchId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM solo_matches WHERE match_id = ?',
    [matchId],
  );
  return (row?.c ?? 0) > 0;
}

// ─── Estadísticas agregadas ───────────────────────────────────────────────────

/** Guarda el cache de estadísticas del usuario */
export async function saveStatsCache(uid: string, stats: SoloStatsSummary): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO solo_stats_cache (uid, payload_json, updated_at)
     VALUES (?, ?, ?)`,
    [uid, JSON.stringify(stats), Date.now()],
  );
}

/** Obtiene el cache de estadísticas del usuario */
export async function getStatsCache(uid: string): Promise<SoloStatsSummary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string }>(
    'SELECT payload_json FROM solo_stats_cache WHERE uid = ?',
    [uid],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload_json) as SoloStatsSummary;
  } catch {
    return null;
  }
}

/** Recalcula estadísticas desde el historial local (usado tras offline sync) */
export async function recalculateStats(uid: string): Promise<SoloStatsSummary> {
  const matches = await getMatchHistory(uid, 500, 0);
  return buildStatsSummary(uid, matches);
}

// ─── Builder de estadísticas ──────────────────────────────────────────────────

function buildStatsSummary(uid: string, matches: CompletedSoloMatch[]): SoloStatsSummary {
  const stats: SoloStatsSummary = {
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    bestScore: 0,
    totalScore: 0,
    totalPlayTimeMs: 0,
    totalCorrectSelections: 0,
    totalWrongSelections: 0,
    cursedLosses: 0,
    perfectRituals: 0,
    bestCorrectStreak: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    averageAccuracy: 0,
    unlockedDifficulties: ['apprentice'],
    lastPlayedAt: null,
    difficultyProgress: {
      apprentice: emptyDifficultyProgress('apprentice'),
      initiated:  emptyDifficultyProgress('initiated'),
      medium:     emptyDifficultyProgress('medium'),
      nightmare:  emptyDifficultyProgress('nightmare'),
      hell:       emptyDifficultyProgress('hell'),
    },
  };

  if (matches.length === 0) return stats;

  let winStreak = 0;
  let accSum = 0;

  for (const m of matches) {
    stats.totalMatches++;
    const won = m.result.status === 'won';
    if (won) {
      stats.totalWins++;
      winStreak++;
      stats.currentWinStreak = winStreak;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, winStreak);
    } else {
      winStreak = 0;
      stats.currentWinStreak = 0;
      stats.totalLosses++;
      if (m.result.cursedSelected) stats.cursedLosses++;
    }

    stats.totalScore += m.score.finalScore;
    stats.bestScore = Math.max(stats.bestScore, m.score.finalScore);
    stats.totalPlayTimeMs += m.timing.activeDurationMs;
    stats.totalCorrectSelections += m.result.correctSelections;
    stats.totalWrongSelections += m.result.wrongSelections + m.result.neutralSelections + m.result.rivalSelections;
    if (m.score.isPerfect) stats.perfectRituals++;
    stats.bestCorrectStreak = Math.max(stats.bestCorrectStreak, m.result.maxCorrectStreak);
    accSum += m.result.accuracy;

    // Progreso por dificultad
    const dp = stats.difficultyProgress[m.difficulty];
    dp.matches++;
    if (won) dp.wins++;
    else dp.losses++;
    dp.bestScore = Math.max(dp.bestScore, m.score.finalScore);
    dp.totalScore += m.score.finalScore;
    dp.totalPlayTimeMs += m.timing.activeDurationMs;
    dp.averageAccuracy = dp.matches > 0
      ? (dp.averageAccuracy * (dp.matches - 1) + m.result.accuracy) / dp.matches
      : m.result.accuracy;
    if (m.score.isPerfect) dp.perfectRituals++;

    if (!stats.lastPlayedAt || m.createdAt > stats.lastPlayedAt) {
      stats.lastPlayedAt = m.createdAt;
    }
  }

  stats.averageAccuracy = matches.length > 0 ? accSum / matches.length : 0;

  return stats;
}

import { SoloDifficultyId, DifficultyProgress } from '../../domain/solo/types/solo.types';

function emptyDifficultyProgress(id: SoloDifficultyId): DifficultyProgress {
  return {
    difficultyId: id,
    matches: 0,
    wins: 0,
    losses: 0,
    bestScore: 0,
    totalScore: 0,
    totalPlayTimeMs: 0,
    averageAccuracy: 0,
    perfectRituals: 0,
    unlocked: id === 'apprentice',
    unlockedAt: id === 'apprentice' ? Date.now() : null,
  };
}
