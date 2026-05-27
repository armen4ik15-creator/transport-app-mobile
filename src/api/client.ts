import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'reestrpro.token';
export const SERVER_URL_KEY = 'SERVER_URL';
const FALLBACK_API_URL = 'http://localhost:3000/api';

let unauthorizedHandler: (() => Promise<void> | void) | null = null;
let serverIssueHandler: (() => Promise<void> | void) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export function setServerIssueHandler(handler: (() => Promise<void> | void) | null) {
  serverIssueHandler = handler;
}

function getDefaultProtocol(port?: string): 'http' | 'https' {
  return port === '443' ? 'https' : 'http';
}

function normalizePort(port?: string): string | null {
  if (!port) return null;
  const clean = port.trim();
  if (!clean) return null;
  return /^\d+$/.test(clean) ? clean : null;
}

export function buildApiUrl(hostOrUrl: string, inputPort?: string): string {
  const hostValue = hostOrUrl.trim();
  if (!hostValue) return FALLBACK_API_URL;

  const explicitPort = normalizePort(inputPort);
  const withoutApi = hostValue.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  const hasProtocol = /^https?:\/\//i.test(withoutApi);

  const protocol = hasProtocol
    ? (withoutApi.split('://')[0].toLowerCase() as 'http' | 'https')
    : getDefaultProtocol(explicitPort ?? undefined);

  const withoutProtocol = withoutApi.replace(/^https?:\/\//i, '');
  const hostWithPathRemoved = withoutProtocol.split('/')[0];
  const hostMatch = hostWithPathRemoved.match(/^([^:]+)(?::(\d+))?$/);
  if (!hostMatch) return FALLBACK_API_URL;

  const host = hostMatch[1];
  const embeddedPort = hostMatch[2];
  const port = explicitPort ?? embeddedPort ?? null;

  return `${protocol}://${host}${port ? `:${port}` : ''}/api`;
}

function normalizeApiUrl(url: string): string {
  return buildApiUrl(url);
}

export async function getServerUrl(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
  if (!saved) return null;
  return normalizeApiUrl(saved);
}

export async function setServerUrl(url: string): Promise<string> {
  const normalized = normalizeApiUrl(url);
  await AsyncStorage.setItem(SERVER_URL_KEY, normalized);
  return normalized;
}

export async function clearServerUrl(): Promise<void> {
  await AsyncStorage.removeItem(SERVER_URL_KEY);
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
  timeout: 15000,
});

api.interceptors.request.use(async (cfg) => {
  cfg.baseURL = await getApiBaseUrl();
  const token = await AsyncStorage.getItem(TOKEN_KEY);
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

    if (isNetworkIssue && serverIssueHandler) {
      await serverIssueHandler();
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
      const serverUnavailableMessage = error.response.data?.error || '';
      if (serverUnavailableMessage.toLowerCase().includes('сервер') && serverIssueHandler) {
        await serverIssueHandler();
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = 'Ошибка'): string {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<{ error?: string }>;
    if (axErr.response?.data?.error) return axErr.response.data.error;
    if (axErr.code === 'ECONNABORTED') return 'Превышено время ожидания';
    if (axErr.message === 'Network Error') {
      return 'Нет связи с сервером. Проверьте настройки адреса сервера.';
    }
    return axErr.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
