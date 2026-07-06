/**
 * seed-demo-data.mjs
 *
 * Crea cuentas demo en Firebase Authentication y les registra historial de
 * partidas real en Realtime Database (partidas/{uid}), usando el mismo SDK
 * cliente y las mismas rutas que usa la app — para tener data real que
 * mostrarle al profesor sin tener que jugar partidas manualmente.
 *
 * Uso: node scripts/seed-demo-data.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getDatabase, ref, push } from 'firebase/database';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Carga manual de .env (script standalone, fuera de Expo) ──────────────────
const envPath = path.join(__dirname, '..', '.env');
const envText = readFileSync(envPath, 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const db = getFirestore(app);

const DEMO_USERS = [
  { email: 'demo1@susurros-demo.com', password: 'Susurros2026', partidas: 6 },
  { email: 'demo2@susurros-demo.com', password: 'Susurros2026', partidas: 3 },
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'INFERNAL'];
const RESULTS = ['BLUE_WIN', 'RED_WIN'];

function randomPartida(daysAgo) {
  const blueTotal = 9;
  const redTotal = 8;
  const result = RESULTS[Math.floor(Math.random() * RESULTS.length)];
  const blueScore = result === 'BLUE_WIN' ? blueTotal : Math.floor(Math.random() * blueTotal);
  const redScore = result === 'RED_WIN' ? redTotal : Math.floor(Math.random() * redTotal);
  const turnos = 4 + Math.floor(Math.random() * 6);
  const iniciadaEn = Date.now() - daysAgo * 86400000 - Math.floor(Math.random() * 3600000);

  return {
    resultado: result,
    dificultad: DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)],
    blueScore,
    redScore,
    blueTotal,
    redTotal,
    turnos,
    iniciadaEn,
    finalizadaEn: iniciadaEn + turnos * 45000,
  };
}

async function ensureUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`  Cuenta creada: ${email} (uid=${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`  Cuenta ya existía, sesión iniciada: ${email} (uid=${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

async function seedProfile(uid) {
  await setDoc(doc(db, 'users', uid), { uid, createdAt: serverTimestamp() }, { merge: true });
}

async function seedPartidas(uid, count) {
  const partidasRef = ref(rtdb, `partidas/${uid}`);
  for (let i = 0; i < count; i++) {
    await push(partidasRef, randomPartida(count - i));
  }
  console.log(`  -> ${count} partidas escritas en partidas/${uid}`);
}

async function main() {
  console.log(`Proyecto Firebase: ${firebaseConfig.projectId}\n`);
  for (const { email, password, partidas } of DEMO_USERS) {
    console.log(`Procesando ${email}...`);
    const user = await ensureUser(email, password);
    await seedProfile(user.uid);
    await seedPartidas(user.uid, partidas);
  }

  console.log('\nListo. Cuentas demo para iniciar sesión en la app:');
  DEMO_USERS.forEach((u) => console.log(`  ${u.email}  /  ${u.password}`));
  process.exit(0);
}

main().catch((err) => {
  console.error('Error generando datos demo:', err);
  process.exit(1);
});
