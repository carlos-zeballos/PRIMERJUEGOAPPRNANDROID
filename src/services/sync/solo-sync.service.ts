/**
 * solo-sync.service.ts
 * Sincronización offline→cloud para el modo Ritual Solitario.
 *
 * Responsabilidades:
 *   1. Subir partidas pendientes a Firestore (una a una, idempotente).
 *   2. Actualizar estadísticas agregadas tras cada subida exitosa.
 *   3. Checkpoints de sesión activa en RTDB.
 *   4. Retry con backoff exponencial.
 *   5. Prevenir ejecuciones simultáneas (mutex).
 *   6. No bloquear el juego ante fallos de red.
 *
 * Se llama desde:
 *   - Inicio de sesión
 *   - Vuelta a primer plano
 *   - Fin de partida
 *   - Recuperación de conexión
 */

import { isOnline } from './connectivity.service';
import {
  getPendingMatches,
  updateMatchSyncStatus,
  saveStatsCache,
  recalculateStats,
} from '../database/SoloRepository';
import {
  uploadSoloMatch,
  updateSoloStatsSummary,
  updateDifficultyStats,
} from '../firebase/soloFirestore';
import {
  checkpointActiveSession,
  clearActiveSessionRTDB,
} from '../firebase/realtime';
import { SoloGameSession } from '../../domain/solo/types/solo.types';

// ─── Mutex ────────────────────────────────────────────────────────────────────
let _isSyncing = false;

export interface SyncReport {
  attempted: number;
  succeeded: number;
  failed:    number;
  skipped:   number;
}

// ─── Subida de partidas pendientes ───────────────────────────────────────────

/**
 * Sube todas las partidas pendientes de un usuario.
 * Seguro llamar varias veces: el mutex previene ejecuciones paralelas.
 */
export async function syncPendingMatches(uid: string): Promise<SyncReport> {
  const report: SyncReport = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };

  if (_isSyncing) {
    report.skipped = 1;
    return report;
  }
  if (!(await isOnline())) {
    report.skipped = 1;
    return report;
  }

  _isSyncing = true;
  try {
    const pending = await getPendingMatches(uid);
    report.attempted = pending.length;

    for (const match of pending) {
      try {
        await updateMatchSyncStatus(match.matchId, 'syncing');

        const { uploaded, alreadyExisted } = await uploadSoloMatch(match);

        if (uploaded) {
          // Solo actualizar estadísticas si la partida no existía previamente
          await updateSoloStatsSummary(uid, match);
          await updateDifficultyStats(uid, match);
          report.succeeded++;
        } else if (alreadyExisted) {
          // Ya existe en la nube — marcar como synced sin duplicar stats
          report.succeeded++;
        }

        await updateMatchSyncStatus(match.matchId, 'synced');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        await updateMatchSyncStatus(match.matchId, 'failed', msg);
        report.failed++;
        // Continúa con la siguiente — no abortar toda la cola
      }
    }

    // Actualizar cache local de estadísticas si se subió algo
    if (report.succeeded > 0) {
      const updatedStats = await recalculateStats(uid);
      await saveStatsCache(uid, updatedStats);
    }
  } finally {
    _isSyncing = false;
  }

  return report;
}

// ─── Checkpoint de sesión activa ─────────────────────────────────────────────

/**
 * Escribe un checkpoint de la sesión activa en RTDB.
 * Silencioso ante errores para no interrumpir el juego.
 */
export async function syncActiveSessionCheckpoint(
  session: SoloGameSession,
  isPaused: boolean,
): Promise<void> {
  if (!(await isOnline())) return;
  try {
    await checkpointActiveSession(session, isPaused);
  } catch {
    // No crítico — el estado local en SQLite es la fuente de verdad
  }
}

/**
 * Elimina la sesión activa del RTDB cuando el ritual termina.
 */
export async function clearRemoteActiveSession(uid: string): Promise<void> {
  if (!(await isOnline())) return;
  try {
    await clearActiveSessionRTDB(uid);
  } catch {
    // No crítico
  }
}

// ─── Retry con backoff exponencial ───────────────────────────────────────────

/**
 * Reintenta una operación con backoff exponencial.
 * @param fn       Función a reintentar
 * @param maxRetry Máximo de intentos
 * @param baseMs   Espera base en ms (se duplica por cada fallo)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetry = 3,
  baseMs = 1000,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetry) throw err;
      const delay = baseMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      await sleep(delay);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
