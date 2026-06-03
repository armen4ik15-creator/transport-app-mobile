import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, login, registerDriver } from '../api/auth';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client';
import type { Driver, User } from '../types';

interface AuthState {
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  initError: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    license_number?: string;
    license_expiry?: string;
    medical_check_expiry?: string;
    invite_code?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setDriver(null);
      return;
    }
    try {
      const me = await getMe();
      setUser(me.user);
      setDriver(me.driver);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setDriver(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e: unknown) {
        setInitError(e instanceof Error ? e.message : 'Ошибка инициализации');
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setUser(null);
      setDriver(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    await refresh();
    return res.user;
  }, [refresh]);

  const signUp = useCallback<AuthState['signUp']>(async (payload) => {
    const res = await registerDriver(payload);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    await refresh();
    return res.user;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setDriver(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, driver, loading, initError, signIn, signUp, signOut, refresh }),
    [user, driver, loading, initError, signIn, signUp, signOut, refresh]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
