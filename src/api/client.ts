import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRODUCTION_API_URL } from '../constants/config';
import {
  getCurrentProductionApiUrl,
  isDeprecatedServerHost,
} from '../constants/deprecatedServers';
import {
  clearStoredToken,
  getStoredToken,
  TOKEN_KEY,
} from '../storage/sessionStorage';

export { TOKEN_KEY };

export const SERVER_URL_KEY = 'SERVER_URL';
const FALLBACK_API_URL = DEFAULT_PRODUCTION_API_URL;

let unauthorizedHandler: (() => Promise<void> | void) | null = null;
let serverIssueHandler: (() => Promise<void> | void) | null = null;
let serverIssueClearHandler: (() => Promise<void> | void) | null = null;
let cachedBaseUrl: string | null = null;
let cachedToken: string | null | undefined;
let consecutiveNetworkFailures = 0;
let lastNetworkFailureAt = 0;

const NETWORK_FAILURE_THRESHOLD = 2;
const NETWORK_FAILURE_WINDOW_MS = 45_000;
const MAX_NETWORK_RETRIES = 2;

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/security-config',
] as const;

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export function resetAuthTokenCache(): void {
  cachedToken = null;
}

export function primeApiClientCache(baseUrl: string, token: string | null): void {
  cachedBaseUrl = baseUrl;
  cachedToken = token;
}

export function clearApiClientCache(): void {
  cachedBaseUrl = null;
  cachedToken = undefined;
}

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export function setServerIssueHandler(handler: (() => Promise<void> | void) | null) {
  serverIssueHandler = handler;
}

export function setServerIssueClearHandler(handler: (() => Promise<void> | void) | null) {
  serverIssueClearHandler = handler;
}

function extractHostFromApiUrl(url: string): string | null {
  const match = url.match(/^https?:\/\/([^:/]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function shouldMigrateServerUrl(url: string): boolean {
  const host = extractHostFromApiUrl(url);
  return host != null && isDeprecatedServerHost(host);
}

async function migrateToCurrentProductionUrl(): Promise<string> {
  const normalized = normalizeApiUrl(getCurrentProductionApiUrl());
  await safeStorageSet(SERVER_URL_KEY, normalized);
  cachedBaseUrl = normalized;
  return normalized;
}

function registerNetworkFailure(): void {
  const now = Date.now();
  if (now - lastNetworkFailureAt > NETWORK_FAILURE_WINDOW_MS) {
    consecutiveNetworkFailures = 0;
  }
  consecutiveNetworkFailures += 1;
  lastNetworkFailureAt = now;
  if (consecutiveNetworkFailures >= NETWORK_FAILURE_THRESHOLD && serverIssueHandler) {
    void serverIssueHandler();
  }
}

function registerNetworkSuccess(): void {
  consecutiveNetworkFailures = 0;
  lastNetworkFailureAt = 0;
  if (serverIssueClearHandler) {
    void serverIssueClearHandler();
  }
}

function isRetryableNetworkError(error: AxiosError): boolean {
  return (
    !error.response ||
    error.message === 'Network Error' ||
    error.code === 'ECONNABORTED' ||
    (error.response.status != null && [502, 503, 504].includes(error.response.status))
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePort(port: string | null | undefined): string | null {
  if (!port) return null;
  const clean = String(port).trim();
  return /^\d+$/.test(clean) ? clean : null;
}

function getDefaultProtocol(host: string, port?: string): 'http' | 'https' {
  if (host.endsWith('.twc1.net')) return 'https';
  return port === '443' ? 'https' : 'http';
}

export function buildApiUrl(hostOrUrl: string, inputPort?: string): string {
  const hostValue = hostOrUrl.trim();
  if (!hostValue) return FALLBACK_API_URL;

  const explicitPort = normalizePort(inputPort);
  const withoutApi = hostValue.replace(/\/(api)?\/?$/i, '');
  const hasProtocol = /^https?:\/\//i.test(withoutApi);

  const withoutProtocol = withoutApi.replace(/^https?:\/\//i, '');
  const hostMatch = withoutProtocol.match(/^([^:/]+)(?::(\d+))?$/);
  if (!hostMatch) return FALLBACK_API_URL;

  const host = hostMatch[1];
  const embeddedPort = hostMatch[2];
  const port = explicitPort ?? embeddedPort ?? null;

  const protocol = hasProtocol
    ? (withoutApi.split('://')[0].toLowerCase() as 'http' | 'https')
    : getDefaultProtocol(host, explicitPort ?? embeddedPort ?? undefined);

  const safeProtocol = host.endsWith('.twc1.net') ? 'https' : protocol;
  const omitPort =
    (safeProtocol === 'https' && port === '443') ||
    (safeProtocol === 'http' && port === '80');
  const safePort =
    host.endsWith('.twc1.net') && port === '3000'
      ? null
      : omitPort
        ? null
        : port;

  return `${safeProtocol}://${host}${safePort ? `:${safePort}` : ''}/api`;
}

function normalizeApiUrl(url: string): string {
  return buildApiUrl(url);
}

async function safeStorageGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function safeStorageSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore — server URL fallback still works in memory
  }
}

async function safeStorageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** При первом запуске сохраняем продакшен-URL, чтобы не требовать ручной настройки */
export async function ensureDefaultServerUrl(): Promise<string> {
  const saved = await safeStorageGet(SERVER_URL_KEY);
  if (saved) return normalizeApiUrl(saved);
  const normalized = normalizeApiUrl(DEFAULT_PRODUCTION_API_URL);
  await safeStorageSet(SERVER_URL_KEY, normalized);
  return normalized;
}

export async function getServerUrl(): Promise<string | null> {
  const saved = await safeStorageGet(SERVER_URL_KEY);
  if (!saved) return null;
  const normalized = normalizeApiUrl(saved);
  if (shouldMigrateServerUrl(normalized)) {
    return migrateToCurrentProductionUrl();
  }
  return normalized;
}

export async function setServerUrl(url: string): Promise<string> {
  const normalized = normalizeApiUrl(url);
  const previous = await getServerUrl();
  await safeStorageSet(SERVER_URL_KEY, normalized);
  cachedBaseUrl = normalized;
  // Токен сбрасываем только при смене сервера
  if (previous && previous !== normalized) {
    await clearStoredToken();
    cachedToken = null;
  }
  return normalized;
}

export async function clearServerUrl(): Promise<void> {
  await safeStorageRemove(SERVER_URL_KEY);
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) {
    if (shouldMigrateServerUrl(cachedBaseUrl)) {
      return migrateToCurrentProductionUrl();
    }
    return cachedBaseUrl;
  }
  let saved = await getServerUrl();
  if (saved && !saved.includes('twc1.net')) {
    saved = null;
    await clearServerUrl();
    clearApiClientCache();
  }
  const url = saved || normalizeApiUrl(getCurrentProductionApiUrl());
  if (!saved || shouldMigrateServerUrl(url)) {
    await setServerUrl(url);
  }
  cachedBaseUrl = url;
  return url;
}

export async function getServerHost(): Promise<string> {
  const apiUrl = await getApiBaseUrl();
  return apiUrl.replace(/\/api\/?$/, '');
}

export const api = axios.create({
  baseURL: FALLBACK_API_URL,
  timeout: 20000,
  adapter: 'fetch',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (cfg) => {
  cfg.baseURL = await getApiBaseUrl();
  const isPublicAuth = isPublicAuthRequest(cfg.url);

  if (isPublicAuth) {
    cfg.headers = cfg.headers ?? {};
    delete cfg.headers.Authorization;
  } else {
    let token = cachedToken;
    if (token === undefined) {
      token = await getStoredToken();
      cachedToken = token;
    }
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
});

api.interceptors.response.use(
  (response) => {
    registerNetworkSuccess();
    return response;
  },
  async (error: AxiosError<{ error?: string }>) => {
    const config = error.config as (InternalAxiosRequestConfig & { __retryCount?: number }) | undefined;
    const retryCount = config?.__retryCount ?? 0;

    if (config && isRetryableNetworkError(error) && retryCount < MAX_NETWORK_RETRIES) {
      config.__retryCount = retryCount + 1;
      await sleep(800 * (retryCount + 1));
      return api.request(config);
    }

    if (isRetryableNetworkError(error)) {
      registerNetworkFailure();
    }

    if (error.response?.status === 401) {
      cachedToken = null;
      await clearStoredToken();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = 'Ошибка'): string {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<{ error?: string }>;
    if (axErr.response?.data?.error) return axErr.response.data.error;
    if (axErr.response?.status === 404) {
      return 'Раздел недоступен на сервере (404). Обновите сервер до последней версии.';
    }
    if (axErr.response?.status === 502) {
      return 'Сервер временно недоступен (502). Подождите минуту и нажмите «Повторить».';
    }
    if (axErr.response?.status === 503 || axErr.response?.status === 504) {
      return 'Сервер перегружен или недоступен. Попробуйте позже.';
    }
    if (axErr.code === 'ECONNABORTED' || axErr.message.includes('timeout')) {
      return 'Сервер не ответил вовремя. Возможно, backend завис — перезапустите ReestrPro Backend на Timeweb и попробуйте снова.';
    }
    if (axErr.message === 'Network Error') {
      return 'Нет связи с сервером. Проверьте интернет, отключите VPN или настройки сервера.';
    }
    return axErr.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
