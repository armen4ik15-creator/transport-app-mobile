import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { getStoredDeviceId, setStoredDeviceId } from './cryptoBundle';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function readPlatformDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    }
    if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync();
    }
  } catch {
    return null;
  }
  return null;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const cached = await getStoredDeviceId();
  if (cached) return cached;

  const platformId = await readPlatformDeviceId();
  const deviceId = platformId
    ? `rp-${Platform.OS}-${platformId}`
    : `rp-${Platform.OS}-${Date.now()}-${randomSuffix()}`;

  await setStoredDeviceId(deviceId);
  return deviceId;
}
