/**
 * realtime.ts
 * Realtime Database — sesión activa del Ritual Solitario.
 *
 * Ruta: activeSoloSessions/{uid}
 *
 * Uso:
 *   - Checkpoint del estado actual de la partida en la nube.
 *   - Recuperación tras fallo en otro dispositivo del mismo usuario.
 *   - NO se usa para historial ni estadísticas (eso va a Firestore).
 *
 * Regla de escritura: solo el usuario autenticado puede leer/escribir
 * en activeSoloSessions/{su propio uid}.
 */

import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  onValue,
  off,
  serverTimestamp,
  DatabaseReference,
} from 'firebase/database';
import { app } from './config';
import { SoloGameSession } from '../../domain/solo/types/solo.types';

const rtdb = getDatabase(app);

/** Payload compacto que se guarda en RTDB (sin turns completos para reducir escrituras) */
interface ActiveSessionPayload {
  sessionId:       string;
  uid:             string;
  version:         number;
  status:          'playing' | 'paused';
  team:            string;
  difficulty:      string;
  seed:            string;
  currentTurnNumber: number;
  activeClue: {
    clueId: string;
    clue: string;
    originalCount: number;
    remainingCount: number;
    remainingTargetWordIds: string[];
    selectionsUsed: number;
    maximumSelections: number;
    status: string;
  } | null;
  runningScore:    number;
  revealedCellIds: string[];
  activeDurationMs: number;
  startedAtClient: number;
  lastCheckpoint:  number;
  updatedAtServer: ReturnType<typeof serverTimestamp>;
}

function sessionRef(uid: string): DatabaseReference {
  return ref(rtdb, `activeSoloSessions/${uid}`);
}

/**
 * Escribe un checkpoint de la sesión activa en RTDB.
 * Se llama en eventos importantes (inicio, selección, pausa),
 * NO en cada tick del timer para evitar exceso de escrituras.
 */
export async function checkpointActiveSession(
  session: SoloGameSession,
  isPaused: boolean,
): Promise<void> {
  const revealedIds = session.board
    .filter(c => c.state === 'REVEALED')
    .map(c => c.id);

  const payload: ActiveSessionPayload = {
    sessionId:         session.sessionId,
    uid:               session.uid,
    version:           Date.now(),
    status:            isPaused ? 'paused' : 'playing',
    team:              session.team,
    difficulty:        session.difficulty,
    seed:              session.seed,
    currentTurnNumber: (session.turns.length) + (session.currentTurn ? 1 : 0),
    activeClue: session.currentTurn?.clue
      ? {
          clueId: session.currentTurn.clue.clueId,
          clue: session.currentTurn.clue.clue,
          originalCount: session.currentTurn.clue.originalCount,
          remainingCount: session.currentTurn.clue.remainingCount,
          remainingTargetWordIds: session.currentTurn.clue.remainingTargetWordIds,
          selectionsUsed: session.currentTurn.clue.selectionsUsed,
          maximumSelections: session.currentTurn.clue.maximumSelections,
          status: session.currentTurn.clue.status,
        }
      : null,
    runningScore:      session.runningScore,
    revealedCellIds:   revealedIds,
    activeDurationMs:  session.activeDurationMs,
    startedAtClient:   session.startedAt,
    lastCheckpoint:    Date.now(),
    updatedAtServer:   serverTimestamp(),
  };

  await set(sessionRef(session.uid), payload);
}

/**
 * Lee la sesión activa en RTDB del usuario.
 * Retorna null si no hay sesión o si está vacía.
 */
export async function readActiveSession(uid: string): Promise<ActiveSessionPayload | null> {
  const snap = await get(sessionRef(uid));
  if (!snap.exists()) return null;
  return snap.val() as ActiveSessionPayload;
}

/**
 * Elimina la sesión activa de RTDB cuando el ritual termina.
 */
export async function clearActiveSessionRTDB(uid: string): Promise<void> {
  await remove(sessionRef(uid));
}

/**
 * Escucha cambios en la sesión activa (para detectar inicio desde otro dispositivo).
 * Retorna la función de unsubscribe — llamar al desmontar el componente.
 */
export function subscribeToActiveSession(
  uid: string,
  onUpdate: (payload: ActiveSessionPayload | null) => void,
): () => void {
  const r = sessionRef(uid);
  const handler = onValue(r, (snap) => {
    onUpdate(snap.exists() ? (snap.val() as ActiveSessionPayload) : null);
  });
  // onValue retorna un unsubscribe en Firebase v9+
  return () => off(r, 'value', handler as never);
}
