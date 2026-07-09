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
import {
  clearDeviceSecrets,
  getStoredDeviceId,
  getStoredDeviceSecret,
} from '../utils/cryptoBundle';
import {
  isDeviceSecurityReady,
  markDeviceSecurityReady,
  resetDeviceSecurityReady,
} from '../utils/deviceSecurity';
import {
  buildHmacPayload,
  extractSigningPath,
  signRequestPayload,
} from '../utils/hmacSign';
import {
  HttpError,
  nativeDeleteJson,
  nativeDownloadBlob,
  nativeGetJson,
  nativePatchJson,
  nativePostJson,
  nativePutJson,
  nativeSendFormData,
} from '../utils/nativeHttpTransport';
import * as FileSystem from 'expo-file-system/legacy';
import { notifyHmacRecovery } from './hmacRecovery';

export { TOKEN_KEY };

export const SERVER_URL_KEY = 'SERVER_URL';
const FALLBACK_API_URL = DEFAULT_PRODUCTION_API_URL;
const DEFAULT_TIMEOUT_MS = 20_000;

let unauthorizedHandler: (() => Promise<void> | void) | null = null;
let serverIssueHandler: (() => Promise<void> | void) | null = null;
let serverIssueClearHandler: (() => Promise<void> | void) | null = null;
let blockedHandler: ((reason: string) => Promise<void> | void) | null = null;
let cachedBaseUrl: string | null = null;
let cachedToken: string | null | undefined;
let consecutiveNetworkFailures = 0;
let lastNetworkFailureAt = 0;

const NETWORK_FAILURE_THRESHOLD = 8;
const NETWORK_FAILURE_WINDOW_MS = 90_000;
const MAX_NETWORK_RETRIES = 2;

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/security-config',
] as const;

const HMAC_EXCLUDED_PATHS = [
  ...PUBLIC_AUTH_PATHS,
  '/auth/reset-device',
  '/device/register',
  '/heartbeat',
  '/health',
] as const;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig {
  params?: object;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: 'json' | 'blob';
}

export { HttpError };

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function isHmacExcludedRequest(url: string | undefined): boolean {
  if (!url) return false;
  return HMAC_EXCLUDED_PATHS.some((path) => url.includes(path));
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

export function setBlockedHandler(handler: ((reason: string) => Promise<void> | void) | null) {
  blockedHandler = handler;
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
  if (host.endsWith('.twc1.net') || port === '443') return 'https';
  return 'http';
}

function resolveProtocol(
  host: string,
  port: string | null,
  hasExplicitProtocol: boolean,
  explicitProtocol: 'http' | 'https',
): 'http' | 'https' {
  if (host.endsWith('.twc1.net') || port === '443') return 'https';
  if (hasExplicitProtocol) return explicitProtocol;
  return getDefaultProtocol(host, port ?? undefined);
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

  const explicitProtocol = hasProtocol
    ? (withoutApi.split('://')[0].toLowerCase() as 'http' | 'https')
    : 'http';

  const safeProtocol = resolveProtocol(host, port, hasProtocol, explicitProtocol);
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

function serializeJsonWireBody(body: unknown): string | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

function resolveHmacBodyString(body: unknown, wireJsonBody: string | undefined): string {
  if (isFormDataBody(body)) return '';
  return wireJsonBody ?? '';
}

function requestNeedsHmac(url: string, isPublicAuth: boolean): boolean {
  return !isPublicAuth && !isHmacExcludedRequest(url);
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

async function applyHmacHeaders(
  headers: Record<string, string>,
  method: HttpMethod,
  requestUrl: string,
  bodyString: string,
): Promise<Record<string, string>> {
  if (!isDeviceSecurityReady()) return headers;

  const [deviceSecret, deviceId] = await Promise.all([
    getStoredDeviceSecret(),
    getStoredDeviceId(),
  ]);
  if (!deviceSecret || !deviceId) return headers;

  const timestamp = Date.now();
  const apiPath = extractSigningPath(requestUrl);
  const payload = buildHmacPayload(timestamp, method, apiPath, bodyString);
  const signature = signRequestPayload(deviceSecret, payload);

  return {
    ...headers,
    'X-Device-Id': deviceId,
    'X-Request-Timestamp': String(timestamp),
    'X-Request-Signature': signature,
  };
}

function isHmacInvalidError(error: HttpError): boolean {
  const payload = error.response?.data as { code?: string; error?: string } | undefined;
  const errorText = payload?.error?.toLowerCase() ?? '';
  return (
    error.response?.status === 403 &&
    (payload?.code === 'HMAC_INVALID' ||
      errorText.includes('подпись') ||
      errorText.includes('invalid signature'))
  );
}

async function resyncDeviceSecurity(): Promise<boolean> {
  resetDeviceSecurityReady();
  await clearDeviceSecrets();
  notifyHmacRecovery(true);

  try {
    const { resetDeviceOnServer, registerDeviceWithServer } = await import('./device');
    try {
      await resetDeviceOnServer();
    } catch {
      await registerDeviceWithServer();
    }
    markDeviceSecurityReady(true);
    return true;
  } catch {
    markDeviceSecurityReady(false);
    return false;
  } finally {
    notifyHmacRecovery(false);
  }
}

async function executeNativeRequest<T>(
  method: HttpMethod,
  requestUrl: string,
  headers: Record<string, string>,
  timeoutMs: number,
  body?: unknown,
  wireJsonBody?: string,
  responseType?: ApiRequestConfig['responseType'],
): Promise<{ data: T }> {
  if (responseType === 'blob') {
    const result = await nativeDownloadBlob(requestUrl, headers, timeoutMs);
    return { data: result.data as T };
  }

  if (isFormDataBody(body)) {
    const result = await nativeSendFormData<T>(
      method as 'POST' | 'PUT' | 'PATCH',
      requestUrl,
      body,
      headers,
      timeoutMs,
    );
    return { data: result.data };
  }

  const jsonPayload = wireJsonBody !== undefined ? wireJsonBody : body;

  switch (method) {
    case 'GET': {
      const result = await nativeGetJson<T>(requestUrl, headers, timeoutMs);
      return { data: result.data };
    }
    case 'POST': {
      const result = await nativePostJson<T>(requestUrl, jsonPayload, headers, timeoutMs);
      return { data: result.data };
    }
    case 'PUT': {
      const result = await nativePutJson<T>(requestUrl, jsonPayload, headers, timeoutMs);
      return { data: result.data };
    }
    case 'PATCH': {
      const result = await nativePatchJson<T>(requestUrl, jsonPayload, headers, timeoutMs);
      return { data: result.data };
    }
    case 'DELETE': {
      const result = await nativeDeleteJson<T>(requestUrl, headers, timeoutMs);
      return { data: result.data };
    }
    default:
      throw new HttpError(`Unsupported method ${method}`);
  }
}

async function executeRequest<T>(
  method: HttpMethod,
  url: string,
  body?: unknown,
  config?: ApiRequestConfig,
  retryCount = 0,
  hmacResyncAttempted = false,
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

  const wireJsonBody = isFormDataBody(body) ? undefined : serializeJsonWireBody(body);
  const hmacBodyString = resolveHmacBodyString(body, wireJsonBody);
  const needsHmac = requestNeedsHmac(url, isPublicAuth);

  if (needsHmac && !isDeviceSecurityReady()) {
    const { ensureDeviceRegistered } = await import('./device');
    await ensureDeviceRegistered();
  }

  const headers = buildRequestHeaders(config?.headers, body, authToken, isPublicAuth);
  const shouldSign = isDeviceSecurityReady() && needsHmac;
  const signedHeaders = shouldSign
    ? await applyHmacHeaders(headers, method, requestUrl, hmacBodyString)
    : headers;
  const timeoutMs = config?.timeout ?? DEFAULT_TIMEOUT_MS;

  try {
    const result = await executeNativeRequest<T>(
      method,
      requestUrl,
      signedHeaders,
      timeoutMs,
      body,
      wireJsonBody,
      config?.responseType,
    );
    registerNetworkSuccess();
    return result;
  } catch (err) {
    const httpError = isHttpError(err)
      ? err
      : new HttpError(err instanceof Error ? err.message : 'Network Error', { code: 'ERR_NETWORK' });

    if (isHmacInvalidError(httpError) && !hmacResyncAttempted) {
      const resynced = await resyncDeviceSecurity();
      if (resynced) {
        return executeRequest<T>(method, url, body, config, retryCount, true);
      }
    }

    if (isRetryableNetworkError(httpError) && retryCount < MAX_NETWORK_RETRIES) {
      await sleep(400 * (retryCount + 1));
      return executeRequest<T>(method, url, body, config, retryCount + 1, hmacResyncAttempted);
    }

    if (isRetryableNetworkError(httpError)) {
      registerNetworkFailure();
    }

    if (httpError.response?.status === 401) {
      cachedToken = null;
      await clearStoredToken();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }

    const blockedPayload = httpError.response?.data as { blocked?: boolean; error?: string; reason?: string } | undefined;
    if (httpError.response?.status === 403 && blockedPayload?.blocked && blockedHandler) {
      await blockedHandler(blockedPayload.reason ?? blockedPayload.error ?? 'Доступ заблокирован');
    }

    throw httpError;
  }
}

function parseUploadResponseBody<T>(raw: string): T {
  if (!raw.trim()) return undefined as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

function parseUploadErrorBody(raw: string): { error?: string } {
  try {
    return JSON.parse(raw) as { error?: string };
  } catch {
    return {};
  }
}

/** Нативная multipart-загрузка — надёжнее FormData+XHR на Android. */
export async function uploadMultipartFile<T>(
  path: string,
  fileUri: string,
  options: {
    fieldName?: string;
    mimeType?: string;
    parameters?: Record<string, string>;
    timeout?: number;
  } = {},
): Promise<{ data: T }> {
  const baseUrl = await getApiBaseUrl();
  const requestUrl = resolveRequestUrl(baseUrl, path);
  const fieldName = options.fieldName ?? 'photo';

  let token = cachedToken;
  if (token === undefined) {
    token = await getStoredToken();
    cachedToken = token;
  }

  if (requestNeedsHmac(path, false) && !isDeviceSecurityReady()) {
    const { ensureDeviceRegistered } = await import('./device');
    await ensureDeviceRegistered();
  }

  let headers = buildRequestHeaders(undefined, null, token, false);
  headers = await applyHmacHeaders(headers, 'POST', requestUrl, '');

  const uploadUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;

  const result = await FileSystem.uploadAsync(requestUrl, uploadUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName,
    mimeType: options.mimeType ?? 'image/jpeg',
    parameters: options.parameters,
    headers,
  });

  const status = result.status ?? 0;
  const rawBody = result.body ?? '';

  if (status < 200 || status >= 300) {
    const payload = parseUploadErrorBody(rawBody);
    throw new HttpError(`Request failed with status ${status}`, {
      response: { status, data: payload },
    });
  }

  registerNetworkSuccess();
  return { data: parseUploadResponseBody<T>(rawBody) };
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
    if (err.response?.status === 400) {
      return 'Сервер отклонил загрузку файла. Проверьте интернет и попробуйте снова.';
    }
    if (err.response?.status === 404) {
      const serverError = err.response?.data?.error?.toLowerCase() ?? '';
      if (serverError.includes('file not found') || serverError.includes('не найден')) {
        return 'Файл не найден на сервере. Возможно, фото потеряно при пересборке.';
      }
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
    if (
      err.message.includes('Unable to resolve host') ||
      err.message.includes('No address associated with hostname')
    ) {
      return 'Сервер не найден (DNS). Отключите VPN и Private DNS, переключите Wi‑Fi или мобильный интернет.';
    }
    if (err.message.toLowerCase().includes('connection closed')) {
      return 'Соединение оборвалось. Отключите VPN (значок ключа вверху экрана) и Private DNS, затем попробуйте снова.';
    }
    if (err.message === 'Network request failed' || err.message === 'Network Error') {
      return 'Не удалось связаться с сервером. Проверьте интернет, отключите VPN и попробуйте снова.';
    }
    if (
      err.code === 'ERR_SSL' ||
      err.message.includes('CertPathValidatorException') ||
      err.message.includes('Trust anchor')
    ) {
      return 'Ошибка защищённого соединения. Обновите приложение до последней версии APK, отключите VPN и Private DNS.';
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
