import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRODUCTION_API_URL } from '../constants/config';
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

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export function setServerIssueHandler(handler: (() => Promise<void> | void) | null) {
  serverIssueHandler = handler;
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
  const safePort = host.endsWith('.twc1.net') && port === '3000' ? '443' : port;

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
  return normalizeApiUrl(saved);
}

export async function setServerUrl(url: string): Promise<string> {
  const normalized = normalizeApiUrl(url);
  const previous = await getServerUrl();
  await safeStorageSet(SERVER_URL_KEY, normalized);
  // Токен сбрасываем только при смене сервера
  if (previous && previous !== normalized) {
    await clearStoredToken();
  }
  return normalized;
}

export async function clearServerUrl(): Promise<void> {
  await safeStorageRemove(SERVER_URL_KEY);
}

export async function getApiBaseUrl(): Promise<string> {
  const saved = await getServerUrl();
  return saved || FALLBACK_API_URL;
}

export async function getServerHost(): Promise<string> {
  const apiUrl = await getApiBaseUrl();
  return apiUrl.replace(/\/api\/?$/, '');
}

export const api = axios.create({
  baseURL: FALLBACK_API_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (cfg) => {
  cfg.baseURL = await getApiBaseUrl();
  const token = await getStoredToken();
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string }>) => {
    const isNetworkIssue =
      !error.response || error.message === 'Network Error' || error.code === 'ECONNABORTED';

    // Сетевые сбои — только баннер, без сброса сессии
    if (isNetworkIssue && serverIssueHandler) {
      await serverIssueHandler();
    }

    if (error.response?.status === 401) {
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
    if (axErr.code === 'ECONNABORTED') return 'Превышено время ожидания';
    if (axErr.message === 'Network Error') {
      return 'Нет связи с сервером. Проверьте интернет или настройки сервера.';
    }
    return axErr.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
