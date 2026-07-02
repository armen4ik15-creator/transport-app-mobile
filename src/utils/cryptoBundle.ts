import * as SecureStore from 'expo-secure-store';

const DEVICE_SECRET_KEY = 'reestrpro.device.secret';
const ACTIVATION_TOKEN_KEY = 'reestrpro.device.activation';
const DEVICE_ID_KEY = 'reestrpro.device.id';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, secureStoreOptions);
  } catch {
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, secureStoreOptions);
  } catch {
    // SecureStore может быть недоступен на эмуляторе — не ломаем старт
  }
}

async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, secureStoreOptions);
  } catch {
    // ignore
  }
}

export async function getStoredDeviceSecret(): Promise<string | null> {
  return safeGet(DEVICE_SECRET_KEY);
}

export async function setStoredDeviceSecret(secret: string): Promise<void> {
  if (!secret) return;
  await safeSet(DEVICE_SECRET_KEY, secret);
}

export async function getStoredActivationToken(): Promise<string | null> {
  return safeGet(ACTIVATION_TOKEN_KEY);
}

export async function setStoredActivationToken(token: string): Promise<void> {
  if (!token) return;
  await safeSet(ACTIVATION_TOKEN_KEY, token);
}

export async function getStoredDeviceId(): Promise<string | null> {
  return safeGet(DEVICE_ID_KEY);
}

export async function setStoredDeviceId(deviceId: string): Promise<void> {
  if (!deviceId) return;
  await safeSet(DEVICE_ID_KEY, deviceId);
}

export async function clearDeviceSecrets(): Promise<void> {
  await Promise.all([
    safeDelete(DEVICE_SECRET_KEY),
    safeDelete(ACTIVATION_TOKEN_KEY),
    safeDelete(DEVICE_ID_KEY),
  ]);
}

export async function hasDeviceCredentials(): Promise<boolean> {
  const [secret, deviceId] = await Promise.all([getStoredDeviceSecret(), getStoredDeviceId()]);
  return Boolean(secret && deviceId);
}
