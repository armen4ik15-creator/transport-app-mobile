import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Driver, User } from '../types';
import { logStartup } from '../utils/startupLogger';

export const TOKEN_KEY = 'reestrpro.token';
const USER_SNAPSHOT_KEY = 'reestrpro.user.snapshot';

interface UserSnapshot {
  user: User;
  driver: Driver | null;
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    void logStartup('storage_read_error', `${key}: ${message}`);
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    void logStartup('storage_write_error', `${key}: ${message}`);
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    void logStartup('storage_remove_error', `${key}: ${message}`);
  }
}

export async function getStoredToken(): Promise<string | null> {
  const token = await safeGetItem(TOKEN_KEY);
  if (token != null && typeof token !== 'string') return null;
  return token;
}

export async function setStoredToken(token: string): Promise<void> {
  if (!token || typeof token !== 'string') return;
  await safeSetItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await safeRemoveItem(TOKEN_KEY);
}

export async function getUserSnapshot(): Promise<UserSnapshot | null> {
  const raw = await safeGetItem(USER_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSnapshot;
  } catch {
    return null;
  }
}

export async function setUserSnapshot(user: User, driver: Driver | null): Promise<void> {
  const payload: UserSnapshot = { user, driver };
  await safeSetItem(USER_SNAPSHOT_KEY, JSON.stringify(payload));
}

export async function clearUserSnapshot(): Promise<void> {
  await safeRemoveItem(USER_SNAPSHOT_KEY);
}

export async function clearSession(): Promise<void> {
  await clearStoredToken();
  await clearUserSnapshot();
}
