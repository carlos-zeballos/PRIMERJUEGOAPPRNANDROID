import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { app } from './config';
import { GameSession } from '../../types/game.types';

export const db = getFirestore(app);

// ── Usuarios ─────────────────────────────────────────────

export interface FirestoreUser {
  uid: string;
  username?: string;
  isGuest: boolean;
  createdAt: Timestamp | null;
}

export async function upsertUser(uid: string, isGuest: boolean): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      isGuest,
      createdAt: serverTimestamp(),
    });
  }
}

export async function setUsername(uid: string, username: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { username }, { merge: true });
}

// ── Partidas ──────────────────────────────────────────────

function sessionToFirestore(session: GameSession, userId: string) {
  return {
    userId,
    result:     session.result,
    blueScore:  session.blueScore,
    redScore:   session.redScore,
    blueTotal:  session.blueTotal,
    redTotal:   session.redTotal,
    config:     session.config,
    board:      session.board,
    turns:      session.turns,
    startedAt:  session.startedAt,
    endedAt:    session.endedAt ?? null,
    syncedAt:   Date.now(),
  };
}

export async function syncGameSession(session: GameSession, userId: string): Promise<void> {
  const ref = doc(db, 'game_sessions', session.id);
  await setDoc(ref, sessionToFirestore(session, userId), { merge: true });
}

export async function fetchUserGameHistory(userId: string, limitCount = 20): Promise<GameSession[]> {
  const q = query(
    collection(db, 'game_sessions'),
    where('userId', '==', userId),
    where('endedAt', '!=', null),
    orderBy('endedAt', 'desc'),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:               d.id,
      config:           data.config,
      board:            data.board,
      turns:            data.turns,
      currentTurnIndex: 0,
      activeTeam:       data.config.firstTeam,
      phase:            'GAME_OVER',
      result:           data.result,
      blueScore:        data.blueScore,
      redScore:         data.redScore,
      blueTotal:        data.blueTotal,
      redTotal:         data.redTotal,
      startedAt:        data.startedAt,
      endedAt:          data.endedAt,
      syncedAt:         data.syncedAt,
    } as GameSession;
  });
}
