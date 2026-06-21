import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getMe, login, registerDriver } from '../api/auth';
import { clearApiClientCache, getApiBaseUrl, primeApiClientCache, setUnauthorizedHandler } from '../api/client';
import {
  clearSession,
  getStoredToken,
  getUserSnapshot,
  setStoredToken,
  setUserSnapshot,
} from '../storage/sessionStorage';
import { isNetworkAuthError, isUnauthorizedError } from '../utils/authErrors';
import { logStartup } from '../utils/startupLogger';
import type { Driver, User } from '../types';

interface AuthState {
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  initError: string | null;
  networkIssue: boolean;
  dataReloadToken: number;
  requestDataReload: () => void;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: {
    email: string;
    password: string;
    confirm_password?: string;
    full_name?: string;
    phone?: string;
    license_number?: string;
    license_expiry?: string;
    medical_check_expiry?: string;
    invite_code?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  clearNetworkIssue: () => void;
  retryInit: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [dataReloadToken, setDataReloadToken] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastRefreshAtRef = useRef(0);

  const applySession = useCallback(async (nextUser: User, nextDriver: Driver | null) => {
    setUser(nextUser);
    setDriver(nextDriver);
    await setUserSnapshot(nextUser, nextDriver);
    setNetworkIssue(false);
  }, []);

  const clearLocalSession = useCallback(async () => {
    await clearSession();
    clearApiClientCache();
    setUser(null);
    setDriver(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) {
      setUser(null);
      setDriver(null);
      return;
    }

    try {
      const me = await getMe();
      await applySession(me.user, me.driver);
    } catch (err: unknown) {
      if (isUnauthorizedError(err)) {
        await clearLocalSession();
        return;
      }
      if (isNetworkAuthError(err)) {
        // Сеть недоступна — восстанавливаем кэш, токен не трогаем
        const snapshot = await getUserSnapshot();
        if (snapshot) {
          setUser(snapshot.user);
          setDriver(snapshot.driver);
        }
        setNetworkIssue(true);
        return;
      }
      await clearLocalSession();
    }
  }, [applySession, clearLocalSession]);

  const bootstrap = useCallback(async () => {
    setInitError(null);
    setLoading(true);
    try {
      void logStartup('auth_bootstrap_start');
      const [token, baseUrl] = await Promise.all([getStoredToken(), getApiBaseUrl()]);
      primeApiClientCache(baseUrl, token);
      void logStartup('auth_token_read', token ? 'present' : 'empty');

      if (token) {
        const snapshot = await getUserSnapshot();
        if (snapshot) {
          setUser(snapshot.user);
          setDriver(snapshot.driver);
          void logStartup('auth_snapshot_restored');
          setLoading(false);
          void refresh();
          void logStartup('auth_bootstrap_done');
          return;
        }
      }

      await refresh();
      void logStartup('auth_bootstrap_done');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка инициализации';
      void logStartup('auth_bootstrap_error', message);
      setInitError(message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setUser(null);
      setDriver(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Обновление сессии при возврате из фона
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;
      if (wasBackground && nextState === 'active') {
        const now = Date.now();
        if (now - lastRefreshAtRef.current > 60_000) {
          lastRefreshAtRef.current = now;
          void refresh();
        }
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await login(email, password);
      await setStoredToken(res.token);
      primeApiClientCache(await getApiBaseUrl(), res.token);
      setUser(res.user);
      await refresh();
      return res.user;
    },
    [refresh]
  );

  const signUp = useCallback<AuthState['signUp']>(
    async (payload) => {
      const res = await registerDriver(payload);
      if ('pending' in res && res.pending) {
        const err = new Error(res.message) as Error & { pending?: boolean };
        err.pending = true;
        throw err;
      }
      await setStoredToken(res.token);
      setUser(res.user);
      await refresh();
      return res.user;
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await clearLocalSession();
  }, [clearLocalSession]);

  const clearNetworkIssue = useCallback(() => setNetworkIssue(false), []);

  const requestDataReload = useCallback(() => {
    setDataReloadToken((token) => token + 1);
  }, []);

  const retryInit = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      driver,
      loading,
      initError,
      networkIssue,
      dataReloadToken,
      requestDataReload,
      signIn,
      signUp,
      signOut,
      refresh,
      clearNetworkIssue,
      retryInit,
    }),
    [
      user,
      driver,
      loading,
      initError,
      networkIssue,
      dataReloadToken,
      requestDataReload,
      signIn,
      signUp,
      signOut,
      refresh,
      clearNetworkIssue,
      retryInit,
    ]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
