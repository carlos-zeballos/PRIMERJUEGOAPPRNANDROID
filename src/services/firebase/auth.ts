/**
 * Firebase Auth — inicialización para React Native.
 *
 * Usa getReactNativePersistence del entry-point RN de @firebase/auth
 * para evitar el error "Expected a class definition" de Firebase v11.
 */

import {
  Auth,
  initializeAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  getAuth,
} from 'firebase/auth';
// Ruta directa al build RN — el subpath './react-native' no está en exports map de Metro
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('../../../node_modules/@firebase/auth/dist/rn/index.js') as {
  getReactNativePersistence: (storage: unknown) => import('firebase/auth').Persistence;
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { app } from './config';

// ── Inicialización ────────────────────────────────────────────────────────────
let firebaseAuthInstance: Auth;

try {
  if (Platform.OS === 'web') {
    firebaseAuthInstance = getAuth(app);
  } else {
    firebaseAuthInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  // Ya inicializado (hot reload)
  firebaseAuthInstance = getAuth(app);
}

export const firebaseAuth = firebaseAuthInstance;

// ── Helpers de auth ───────────────────────────────────────────────────────────

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(firebaseAuth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

export function getCurrentUser(): User | null {
  return firebaseAuth.currentUser;
}

// Nota: el login con Google se resuelve en components/BtnLoginGoogle.tsx
// usando expo-auth-session + signInWithCredential(firebaseAuth, ...).
