import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Driver, User } from '../types';

export const TOKEN_KEY = 'reestrpro.token';
const USER_SNAPSHOT_KEY = 'reestrpro.user.snapshot';
const LEGACY_TOKEN_KEY = 'reestrpro.token';

interface UserSnapshot {
  user: User;
  driver: Driver | null;
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // На некоторых устройствах SecureStore недоступен — fallback
    return AsyncStorage.getItem(key);
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

/** Миграция токена из AsyncStorage в SecureStore (однократно) */
async function migrateLegacyToken(): Promise<string | null> {
  const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return null;
  await secureSet(TOKEN_KEY, legacy);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacy;
}

export async function getStoredToken(): Promise<string | null> {
  const secure = await secureGet(TOKEN_KEY);
  if (secure) return secure;
  return migrateLegacyToken();
}

export async function setStoredToken(token: string): Promise<void> {
  await secureSet(TOKEN_KEY, token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function clearStoredToken(): Promise<void> {
  await secureDelete(TOKEN_KEY);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function getUserSnapshot(): Promise<UserSnapshot | null> {
  const raw = await secureGet(USER_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSnapshot;
  } catch {
    return null;
  }
}

export async function setUserSnapshot(user: User, driver: Driver | null): Promise<void> {
  const payload: UserSnapshot = { user, driver };
  await secureSet(USER_SNAPSHOT_KEY, JSON.stringify(payload));
}

export async function clearUserSnapshot(): Promise<void> {
  await secureDelete(USER_SNAPSHOT_KEY);
}

export async function clearSession(): Promise<void> {
  await clearStoredToken();
  await clearUserSnapshot();
}
