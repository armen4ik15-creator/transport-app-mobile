import { DEFAULT_PRODUCTION_HOST } from '../constants/config';

interface HealthLiveResponse {
  status?: string;
}

export async function probeServerHealth(apiUrl: string, timeoutMs = 25000): Promise<boolean> {
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
