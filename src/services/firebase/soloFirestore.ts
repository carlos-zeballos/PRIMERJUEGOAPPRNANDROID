/**
 * soloFirestore.ts
 * Operaciones Firestore para el modo Ritual Solitario.
 *
 * Colecciones:
 *   users/{uid}/soloMatches/{matchId}     — partidas (inmutables una vez creadas)
 *   users/{uid}/soloStats/summary         — estadísticas agregadas
 *   users/{uid}/difficultyStats/{diffId}  — progreso por dificultad
 *
 * Reglas clave:
 *   - El cliente nunca sobreescribe un documento ya existente en soloMatches.
 *   - Las estadísticas se actualizan con merge atómico.
 *   - Los errores NO deben bloquear el juego.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firestore';
import {
  CompletedSoloMatch,
  SoloStatsSummary,
  DifficultyProgress,
  SoloDifficultyId,
} from '../../domain/solo/types/solo.types';

// ─── Rutas ────────────────────────────────────────────────────────────────────

const paths = {
  match:      (uid: string, matchId: string) => `users/${uid}/soloMatches/${matchId}`,
  summary:    (uid: string)                  => `users/${uid}/soloStats/summary`,
  difficulty: (uid: string, id: string)      => `users/${uid}/difficultyStats/${id}`,
} as const;

// ─── Partidas ─────────────────────────────────────────────────────────────────

/**
 * Sube una partida completada a Firestore.
 * Usa `setDoc` sin merge para que sea idempotente y el documento
 * sea inmutable una vez creado (si ya existe, no lo reemplaza).
 * Retorna false si la partida ya existía (no duplica estadísticas).
 */
export async function uploadSoloMatch(
  match: CompletedSoloMatch,
): Promise<{ uploaded: boolean; alreadyExisted: boolean }> {
  const ref  = doc(db, paths.match(match.uid, match.matchId));
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { uploaded: false, alreadyExisted: true };
  }

  await setDoc(ref, {
    matchId:        match.matchId,
    uid:            match.uid,
    mode:           'solo',
    team:           match.team,
    difficulty:     match.difficulty,
    seed:           match.seed,
    wordPackVersion: match.wordPackVersion,
    engineVersion:  match.engineVersion,

    score:   match.score,
    result:  match.result,
    timing:  match.timing,

    // No subimos turns completos (puede ser grande) — solo el resumen
    turnsPlayed: match.result.turnsPlayed,

    status:             match.result.status,
    finalScore:         match.score.finalScore,
    accuracy:           match.result.accuracy,

    createdAtServer:    serverTimestamp(),
    completedAtServer:  serverTimestamp(),
    schemaVersion:      1,
    verificationStatus: 'client',
  });

  return { uploaded: true, alreadyExisted: false };
}

// ─── Estadísticas agregadas ───────────────────────────────────────────────────

/**
 * Actualiza el resumen de estadísticas usando `increment` para operaciones
 * atómicas y evitar condiciones de carrera con múltiples dispositivos.
 * Solo se llama cuando la partida fue subida por primera vez (no duplicados).
 */
export async function updateSoloStatsSummary(
  uid: string,
  match: CompletedSoloMatch,
): Promise<void> {
  const ref = doc(db, paths.summary(uid));
  const won = match.result.status === 'won';

  await setDoc(
    ref,
    {
      totalMatches:           increment(1),
      totalWins:              increment(won ? 1 : 0),
      totalLosses:            increment(won ? 0 : 1),
      totalScore:             increment(match.score.finalScore),
      bestScore:              match.score.finalScore,  // se maneja como campo normal
      totalPlayTimeMs:        increment(match.timing.activeDurationMs),
      totalCorrectSelections: increment(match.result.correctSelections),
      totalWrongSelections:   increment(match.result.wrongSelections + match.result.neutralSelections + match.result.rivalSelections),
      cursedLosses:           increment(match.result.cursedSelected ? 1 : 0),
      perfectRituals:         increment(match.score.isPerfect ? 1 : 0),
      lastPlayedAt:           serverTimestamp(),
      updatedAt:              serverTimestamp(),
      schemaVersion:          1,
    },
    { merge: true },
  );

  // bestScore se actualiza solo si el nuevo puntaje es mayor
  const snap = await getDoc(ref);
  const current = snap.data();
  if (!current || match.score.finalScore > (current.bestScore ?? 0)) {
    await updateDoc(ref, { bestScore: match.score.finalScore });
  }
}

/**
 * Actualiza las estadísticas por dificultad de la partida.
 */
export async function updateDifficultyStats(
  uid: string,
  match: CompletedSoloMatch,
): Promise<void> {
  const ref = doc(db, paths.difficulty(uid, match.difficulty));
  const won = match.result.status === 'won';

  await setDoc(
    ref,
    {
      difficultyId:    match.difficulty,
      matches:         increment(1),
      wins:            increment(won ? 1 : 0),
      losses:          increment(won ? 0 : 1),
      totalScore:      increment(match.score.finalScore),
      totalPlayTimeMs: increment(match.timing.activeDurationMs),
      perfectRituals:  increment(match.score.isPerfect ? 1 : 0),
      updatedAt:       serverTimestamp(),
    },
    { merge: true },
  );

  // bestScore solo si supera el anterior
  const snap = await getDoc(ref);
  const cur  = snap.data();
  if (!cur || match.score.finalScore > (cur.bestScore ?? 0)) {
    await updateDoc(ref, { bestScore: match.score.finalScore });
  }
}

/**
 * Descarga el resumen de estadísticas remotas del usuario.
 * Usado al iniciar sesión para sincronizar el estado del cloud.
 */
export async function fetchRemoteSummary(uid: string): Promise<Partial<SoloStatsSummary> | null> {
  const snap = await getDoc(doc(db, paths.summary(uid)));
  if (!snap.exists()) return null;
  return snap.data() as Partial<SoloStatsSummary>;
}

/**
 * Registra el desbloqueo de una dificultad en Firestore.
 */
export async function unlockDifficultyRemote(
  uid: string,
  difficultyId: SoloDifficultyId,
): Promise<void> {
  await setDoc(
    doc(db, paths.difficulty(uid, difficultyId)),
    {
      unlocked:    true,
      unlockedAt:  serverTimestamp(),
      updatedAt:   serverTimestamp(),
    },
    { merge: true },
  );
}
