import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
  subscribeToAuthChanges,
} from '../services/firebase/auth';
import { upsertUser } from '../services/firebase/firestore';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setIsInitialized(true);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const u = await loginWithEmail(email, password);
      await upsertUser(u.uid);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      setIsLoading(false);
      return false;
    }
  }

  async function register(email: string, password: string): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const u = await registerWithEmail(email, password);
      await upsertUser(u.uid);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      setIsLoading(false);
      return false;
    }
  }

  async function logout(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await firebaseLogout();
      setUser(null);
      setIsLoading(false);
    } catch (err) {
      setError(errorMessage(err));
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isInitialized, error, login, register, logout, clearError }),
    [user, isLoading, isInitialized, error],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
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
