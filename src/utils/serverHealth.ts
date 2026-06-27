import { DEFAULT_PRODUCTION_HOST } from '../constants/config';
import { nativeGetJson } from './nativeHttpTransport';

interface HealthLiveResponse {
  status?: string;
}

function isHealthyStatus(data: HealthLiveResponse): boolean {
  return data.status === 'ok' || data.status === 'degraded';
}

export async function probeServerHealth(apiUrl: string, timeoutMs = 25000): Promise<boolean> {
  const healthUrl = `${apiUrl.replace(/\/$/, '')}/health/live`;
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
