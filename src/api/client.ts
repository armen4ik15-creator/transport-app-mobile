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
const DEFAULT_TIMEOUT_MS = 20_000;

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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig {
  params?: object;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: 'json' | 'blob';
}

export class HttpError extends Error {
  response?: { status: number; data: { error?: string } };
  code?: string;

  constructor(
    message: string,
    options?: { response?: { status: number; data: { error?: string } }; code?: string },
  ) {
    super(message);
    this.name = 'HttpError';
    this.response = options?.response;
    this.code = options?.code;
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}

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

function isRetryableNetworkError(error: HttpError): boolean {
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

function appendQueryParams(url: string, params?: object): string {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value != null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

function resolveRequestUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function buildRequestHeaders(
  configHeaders: Record<string, string> | undefined,
  body: unknown,
  authToken: string | null,
  isPublicAuth: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...configHeaders,
  };

  if (isFormDataBody(body)) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else if (body != null && body !== undefined && !(body instanceof Blob)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (isPublicAuth) {
    delete headers.Authorization;
    delete headers.authorization;
  } else if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

async function parseErrorResponse(response: Response): Promise<{ error?: string }> {
  try {
    const data = (await response.json()) as { error?: string };
    return data;
  } catch {
    return {};
  }
}

async function executeRequest<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  config?: ApiRequestConfig,
  retryCount = 0,
): Promise<{ data: T }> {
  const baseUrl = await getApiBaseUrl();
  const requestUrl = appendQueryParams(resolveRequestUrl(baseUrl, url), config?.params);
  const isPublicAuth = isPublicAuthRequest(url);

  let authToken: string | null = null;
  if (!isPublicAuth) {
    let token = cachedToken;
    if (token === undefined) {
      token = await getStoredToken();
      cachedToken = token;
    }
    authToken = token;
  }

  const headers = buildRequestHeaders(config?.headers, body, authToken, isPublicAuth);
  const timeoutMs = config?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let fetchBody: BodyInit | undefined;
  if (body != null && body !== undefined) {
    fetchBody = isFormDataBody(body) ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(requestUrl, {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : fetchBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      const httpError = new HttpError(`Request failed with status ${response.status}`, {
        response: { status: response.status, data: errorData },
      });

      if (isRetryableNetworkError(httpError) && retryCount < MAX_NETWORK_RETRIES) {
        await sleep(800 * (retryCount + 1));
        return executeRequest<T>(method, url, body, config, retryCount + 1);
      }

      if (isRetryableNetworkError(httpError)) {
        registerNetworkFailure();
      }

      if (response.status === 401) {
        cachedToken = null;
        await clearStoredToken();
        if (unauthorizedHandler) {
          await unauthorizedHandler();
        }
      }

      throw httpError;
    }

    registerNetworkSuccess();

    if (config?.responseType === 'blob') {
      const blob = await response.blob();
      return { data: blob as T };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as T;
      return { data };
    }

    const text = await response.text();
    return { data: text as T };
  } catch (err) {
    clearTimeout(timeoutId);

    if (isHttpError(err)) {
      throw err;
    }

    const isAbort = err instanceof Error && err.name === 'AbortError';
    const isNetwork =
      err instanceof TypeError ||
      (err instanceof Error &&
        (err.message === 'Network request failed' ||
          err.message.includes('Failed to fetch') ||
          err.message === 'Network Error'));

    const httpError = new HttpError(
      isAbort ? 'timeout' : isNetwork ? 'Network Error' : err instanceof Error ? err.message : 'Network Error',
      { code: isAbort ? 'ECONNABORTED' : isNetwork ? 'ERR_NETWORK' : undefined },
    );

    if (isRetryableNetworkError(httpError) && retryCount < MAX_NETWORK_RETRIES) {
      await sleep(800 * (retryCount + 1));
      return executeRequest<T>(method, url, body, config, retryCount + 1);
    }

    if (isRetryableNetworkError(httpError)) {
      registerNetworkFailure();
    }

    throw httpError;
  }
}

export const api = {
  baseURL: FALLBACK_API_URL,
  get<T>(url: string, config?: ApiRequestConfig): Promise<{ data: T }> {
    return executeRequest<T>('GET', url, undefined, config);
  },
  post<T>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<{ data: T }> {
    return executeRequest<T>('POST', url, body, config);
  },
  put<T>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<{ data: T }> {
    return executeRequest<T>('PUT', url, body, config);
  },
  patch<T>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<{ data: T }> {
    return executeRequest<T>('PATCH', url, body, config);
  },
  delete<T = void>(url: string, config?: ApiRequestConfig): Promise<{ data: T }> {
    return executeRequest<T>('DELETE', url, undefined, config);
  },
};

export function apiErrorMessage(err: unknown, fallback = 'Ошибка'): string {
  if (isHttpError(err)) {
    if (err.response?.data?.error) return err.response.data.error;
    if (err.response?.status === 404) {
      return 'Раздел недоступен на сервере (404). Обновите сервер до последней версии.';
    }
    if (err.response?.status === 502) {
      return 'Сервер временно недоступен (502). Подождите минуту и нажмите «Повторить».';
    }
    if (err.response?.status === 503 || err.response?.status === 504) {
      return 'Сервер перегружен или недоступен. Попробуйте позже.';
    }
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return 'Сервер не ответил вовремя. Возможно, backend завис — перезапустите ReestrPro Backend на Timeweb и попробуйте снова.';
    }
    if (err.message === 'Network Error') {
      return 'Нет связи с сервером. Проверьте интернет и адрес сервера в настройках.';
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
