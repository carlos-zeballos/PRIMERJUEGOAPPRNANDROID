import { create } from 'zustand';
import { User } from 'firebase/auth';
import {
  signInAsGuest,
  loginWithEmail,
  registerWithEmail,
  upgradeGuestAccount,
  logout,
  subscribeToAuthChanges,
  signInWithGoogle,
  isGoogleSignInCancelled,
} from '../services/firebase/auth';
import { upsertUser } from '../services/firebase/firestore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => () => void;
  continueAsGuest: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  upgradeGuest: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, isInitialized: true });
    });
    return unsubscribe;
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithGoogle();
      await upsertUser(user.uid, false);
      set({ isLoading: false });
    } catch (err) {
      // No mostrar error si el usuario simplemente canceló
      if (isGoogleSignInCancelled(err)) {
        set({ isLoading: false });
      } else {
        set({ error: errorMessage(err), isLoading: false });
      }
    }
  },

  continueAsGuest: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInAsGuest();
      await upsertUser(user.uid, true);
      set({ isLoading: false });
    } catch (err) {
      set({ error: errorMessage(err), isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginWithEmail(email, password);
      await upsertUser(user.uid, false);
      set({ isLoading: false });
    } catch (err) {
      set({ error: errorMessage(err), isLoading: false });
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await registerWithEmail(email, password);
      await upsertUser(user.uid, false);
      set({ isLoading: false });
    } catch (err) {
      set({ error: errorMessage(err), isLoading: false });
    }
  },

  upgradeGuest: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await upgradeGuestAccount(email, password);
      set({ isLoading: false });
    } catch (err) {
      set({ error: errorMessage(err), isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logout();
      set({ user: null, isLoading: false });
    } catch (err) {
      set({ error: errorMessage(err), isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Traduce los códigos de error de Firebase a español
    const msg = err.message;
    if (msg.includes('email-already-in-use'))  return 'Ese correo ya está registrado.';
    if (msg.includes('wrong-password'))         return 'Contraseña incorrecta.';
    if (msg.includes('user-not-found'))         return 'No existe cuenta con ese correo.';
    if (msg.includes('invalid-email'))          return 'Correo electrónico inválido.';
    if (msg.includes('weak-password'))          return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('network-request-failed')) return 'Sin conexión. Verifica tu internet.';
    if (msg.includes('credential-already-in-use')) return 'Ese correo ya está vinculado a otra cuenta.';
    return err.message;
  }
  return 'Error desconocido.';
}
