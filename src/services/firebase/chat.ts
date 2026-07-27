/**
 * Chat general de atención al cliente — sala única en Firestore.
 * Sigue la metodología de la Sesión 7 (colección /mensajes con
 * campos texto, usuario, fecha; lectura/escritura solo con auth).
 */

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  limit as limitTo,
} from 'firebase/firestore';
import { db } from './firestore';

const MESSAGES_COLLECTION = 'mensajes';
const HISTORY_LIMIT = 200;

export interface ChatMessage {
  id: string;
  texto: string;
  usuario: string;
  fecha: Timestamp | null;
}

export async function sendChatMessage(texto: string, usuario: string): Promise<void> {
  const trimmed = texto.trim();
  if (!trimmed) return;
  await addDoc(collection(db, MESSAGES_COLLECTION), {
    texto: trimmed,
    usuario,
    fecha: serverTimestamp(),
  });
}

export function subscribeToChatMessages(
  onMessages: (messages: ChatMessage[]) => void,
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    orderBy('fecha', 'asc'),
    limitTo(HISTORY_LIMIT),
  );
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as { texto: string; usuario: string; fecha: Timestamp | null };
      return { id: docSnap.id, texto: data.texto, usuario: data.usuario, fecha: data.fecha };
    });
    onMessages(messages);
  });
}
