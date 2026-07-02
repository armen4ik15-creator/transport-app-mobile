import { DEFAULT_PRODUCTION_HOST } from '../constants/config';
import { nativeGetJson } from './nativeHttpTransport';

interface HealthLiveResponse {
  status?: string;
}

function isHealthyStatus(data: HealthLiveResponse): boolean {
  return data.status === 'ok' || data.status === 'degraded';
}

async function probeHealthPath(
  apiUrl: string,
  path: '/health' | '/health/live',
  timeoutMs: number,
): Promise<boolean> {
  const healthUrl = `${apiUrl.replace(/\/$/, '')}${path}`;
  try {
    const { data } = await nativeGetJson<HealthLiveResponse>(
      healthUrl,
      { Accept: 'application/json' },
      timeoutMs,
    );
    return isHealthyStatus(data);
  } catch {
    return false;
  }
}

export async function probeServerHealth(apiUrl: string, timeoutMs = 25000): Promise<boolean> {
  const primaryOk = await probeHealthPath(apiUrl, '/health', timeoutMs);
  if (primaryOk) return true;
  return probeHealthPath(apiUrl, '/health/live', timeoutMs);
}

export async function probeServerHealthWithRetry(
  apiUrl: string,
  attempts = 2,
  timeoutMs = 8000
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
