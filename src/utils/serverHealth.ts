import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_PRODUCTION_HOST } from '../constants/config';

interface HealthLiveResponse {
  status?: string;
}

async function probeWithFetch(apiUrl: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/health/live`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as HealthLiveResponse;
    return data.status === 'ok' || data.status === 'degraded';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function probeWithFileSystem(apiUrl: string): Promise<boolean> {
  const target = `${FileSystem.cacheDirectory ?? ''}health-live-${Date.now()}.json`;
  try {
    const result = await FileSystem.downloadAsync(
      `${apiUrl.replace(/\/$/, '')}/health/live`,
      target
    );
    if (result.status !== 200) return false;
    const raw = await FileSystem.readAsStringAsync(target);
    const data = JSON.parse(raw) as HealthLiveResponse;
    return data.status === 'ok' || data.status === 'degraded';
  } catch {
    return false;
  }
}

export async function probeServerHealth(apiUrl: string, timeoutMs = 25000): Promise<boolean> {
  const fetchOk = await probeWithFetch(apiUrl, timeoutMs);
  if (fetchOk) return true;
  return probeWithFileSystem(apiUrl);
}

export async function probeServerHealthWithRetry(
  apiUrl: string,
  attempts = 3,
  timeoutMs = 25000
): Promise<boolean> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ok = await probeServerHealth(apiUrl, timeoutMs);
    if (ok) return true;
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }
  return false;
}

export function isProductionHost(host: string): boolean {
  return host.trim().toLowerCase() === DEFAULT_PRODUCTION_HOST.toLowerCase();
}
