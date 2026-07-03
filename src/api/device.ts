import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './client';
import {
  setStoredActivationToken,
  setStoredDeviceId,
  setStoredDeviceSecret,
} from '../utils/cryptoBundle';
import {
  markDeviceSecurityReady,
  resetDeviceSecurityReady,
  runDeviceRegistrationOnce,
} from '../utils/deviceSecurity';
import { getOrCreateDeviceId } from '../utils/deviceId';

export interface DeviceRegistrationResponse {
  device_id: string;
  secret: string;
  activation_token: string;
  reused?: boolean;
  reset?: boolean;
  rebound?: boolean;
}

export async function resetDeviceOnServer(): Promise<DeviceRegistrationResponse> {
  const deviceId = await getOrCreateDeviceId();
  const { data } = await api.post<DeviceRegistrationResponse>('/auth/reset-device', {
    device_id: deviceId,
  });

  await setStoredDeviceId(data.device_id);
  await setStoredDeviceSecret(data.secret);
  await setStoredActivationToken(data.activation_token);
  markDeviceSecurityReady(true);

  return data;
}

export async function registerDeviceWithServer(): Promise<DeviceRegistrationResponse | null> {
  const deviceId = await getOrCreateDeviceId();
  const appVersion = Constants.expoConfig?.version ?? 'unknown';

  const { data } = await api.post<DeviceRegistrationResponse>('/device/register', {
    device_id: deviceId,
    platform: Platform.OS,
    app_version: appVersion,
  });

  await setStoredDeviceId(data.device_id);
  await setStoredDeviceSecret(data.secret);
  await setStoredActivationToken(data.activation_token);
  markDeviceSecurityReady(true);

  return data;
}

const REGISTRATION_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Device registration timeout'));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function ensureDeviceRegistered(): Promise<boolean> {
  return runDeviceRegistrationOnce(async () => {
    try {
      await withTimeout(registerDeviceWithServer(), REGISTRATION_TIMEOUT_MS);
      return true;
    } catch {
      markDeviceSecurityReady(false);
      return false;
    }
  });
}

export function resetDeviceRegistrationState(): void {
  resetDeviceSecurityReady();
}
