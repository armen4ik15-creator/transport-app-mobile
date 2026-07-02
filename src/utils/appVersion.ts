import Constants from 'expo-constants';

/** Версия из app.json — обновляется через OTA без нового APK */
export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

/** Runtime для OTA — меняется только при установке нового APK с native-изменениями */
export function getOtaRuntimeVersion(): string {
  const runtime = Constants.expoConfig?.runtimeVersion;
  if (typeof runtime === 'string') return runtime;
  return 'unknown';
}
