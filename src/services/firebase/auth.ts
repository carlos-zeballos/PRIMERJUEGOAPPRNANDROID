/**
 * Firebase Auth — inicialización para React Native.
 *
 * Usa getReactNativePersistence del entry-point RN de @firebase/auth
 * para evitar el error "Expected a class definition" de Firebase v11.
 */

import {
  Auth,
  initializeAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User,
  getAuth,
} from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
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

export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(firebaseAuth);
  return result.user;
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

export async function upgradeGuestAccount(email: string, password: string): Promise<User> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('No hay sesión activa.');
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);
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

// ── Google Sign-In ────────────────────────────────────────────────────────────

/**
 * Configura Google Sign-In. Llamar una vez al iniciar la app.
 * El webClientId se obtiene en Firebase Console → Autenticación → Proveedores → Google.
 */
export function configureGoogleSignIn(webClientId: string): void {
  GoogleSignin.configure({ webClientId, offlineAccess: false });
}

/**
 * Inicia sesión con Google y vincula la cuenta a Firebase.
 * Maneja correctamente la cancelación del usuario.
 */
export async function signInWithGoogle(): Promise<User> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const { data } = await GoogleSignin.signIn();
  if (!data?.idToken) throw new Error('No se obtuvo token de Google.');

  const credential = GoogleAuthProvider.credential(data.idToken);
  const result     = await signInWithCredential(firebaseAuth, credential);
  return result.user;
}

/** Verifica si el error viene de que el usuario canceló el proceso */
export function isGoogleSignInCancelled(err: unknown): boolean {
  return (err as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED;
}
