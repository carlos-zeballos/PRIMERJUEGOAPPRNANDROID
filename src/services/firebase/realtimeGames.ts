import { getDatabase, ref, push, onValue } from 'firebase/database';
import { app } from './config';
import { GameSession } from '../../types/game.types';

const db = getDatabase(app);

export interface PartidaHistorial {
  id: string;
  resultado: string;
  dificultad: string;
  blueScore: number;
  redScore: number;
  blueTotal: number;
  redTotal: number;
  turnos: number;
  iniciadaEn: number;
  finalizadaEn: number | null;
}

export async function registrarPartida(uid: string, session: GameSession): Promise<void> {
  const partidasRef = ref(db, `partidas/${uid}`);

  await push(partidasRef, {
    resultado:    session.result,
    dificultad:   session.config.difficulty,
    blueScore:    session.blueScore,
    redScore:     session.redScore,
    blueTotal:    session.blueTotal,
    redTotal:     session.redTotal,
    turnos:       session.turns.length,
    iniciadaEn:   session.startedAt,
    finalizadaEn: session.endedAt ?? null,
  });
}

export function suscribirHistorialPartidas(
  uid: string,
  callback: (partidas: PartidaHistorial[]) => void,
): () => void {
  const partidasRef = ref(db, `partidas/${uid}`);

  const unsubscribe = onValue(partidasRef, (snapshot) => {
    const data = snapshot.val();

    if (data) {
      const lista = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      callback(lista);
    } else {
      callback([]);
    }
  });

  return () => unsubscribe();
}
