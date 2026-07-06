import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { app } from './config';

export const db = getFirestore(app);

// ── Usuarios ─────────────────────────────────────────────

export interface FirestoreUser {
  uid: string;
  username?: string;
  createdAt: Timestamp | null;
}

export async function upsertUser(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      createdAt: serverTimestamp(),
    });
  }
}

export async function setUsername(uid: string, username: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { username }, { merge: true });
}

// Nota: el historial de partidas (registro y listado en tiempo real) se
// resuelve en src/services/firebase/realtimeGames.ts con Realtime Database
// (push/onValue), no con Firestore.
