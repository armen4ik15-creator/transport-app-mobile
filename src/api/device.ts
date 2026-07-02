import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './client';
import {
  setStoredActivationToken,
  setStoredDeviceId,
  setStoredDeviceSecret,
} from '../utils/cryptoBundle';
import { getOrCreateDeviceId } from '../utils/deviceId';

export interface DeviceRegistrationResponse {
  device_id: string;
  secret: string;
  activation_token: string;
  reused?: boolean;
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

  return data;
}
