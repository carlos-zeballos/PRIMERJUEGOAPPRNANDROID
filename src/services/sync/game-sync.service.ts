/**
 * game-sync.service.ts
 * Sincronización offline→nube para el historial de Modo Local.
 *
 * registrarPartida() se llama en caliente al terminar cada partida
 * (gameStore.ts) pero si falla (sin conexión, permisos, etc.) el error se
 * descarta en silencio — la partida queda guardada en SQLite con
 * synced_at = NULL. Este servicio reintenta esas partidas pendientes.
 *
 * Se llama desde: app/_layout.tsx (al recuperar conexión y al iniciar sesión).
 */

import { isOnline } from './connectivity.service';
import { getPendingGames, markGameSynced } from '../database/GameRepository';
import { registrarPartida } from '../firebase/realtimeGames';

let _isSyncing = false;

export interface GameSyncReport {
  attempted: number;
  succeeded: number;
  failed: number;
}

/** Reintenta subir a Realtime Database las partidas locales pendientes de un usuario. */
export async function syncPendingGames(uid: string): Promise<GameSyncReport> {
  const report: GameSyncReport = { attempted: 0, succeeded: 0, failed: 0 };

  if (_isSyncing) return report;
  if (!(await isOnline())) return report;

  _isSyncing = true;
  try {
    const pending = await getPendingGames(uid);
    report.attempted = pending.length;

    for (const session of pending) {
      try {
        await registrarPartida(uid, session);
        await markGameSynced(session.id, Date.now());
        report.succeeded++;
      } catch {
        report.failed++;
        // Continúa con la siguiente — no abortar toda la cola
      }
    }
  } finally {
    _isSyncing = false;
  }

  return report;
}
