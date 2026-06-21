import {
  DEFAULT_PRODUCTION_API_URL,
  DEFAULT_PRODUCTION_HOST,
} from './config';

/** Timeweb hosts that must be migrated to the current production server */
export const DEPRECATED_SERVER_HOSTS = [
  'armen4ik15-creator-transport-app-server-43b9.twc1.net',
  'armen4ik15-creator-transport-app-server-1d1c.twc1.net',
] as const;

export function isDeprecatedServerHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return DEPRECATED_SERVER_HOSTS.some((item) => item === normalized);
}

export function getCurrentProductionApiUrl(): string {
  return DEFAULT_PRODUCTION_API_URL;
}

export function getCurrentProductionHost(): string {
  return DEFAULT_PRODUCTION_HOST;
}
