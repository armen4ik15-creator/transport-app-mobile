import * as FileSystem from 'expo-file-system/legacy';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

export interface NativeHttpResult<T> {
  status: number;
  data: T;
}

function isSslTrustError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('CertPathValidatorException') ||
    err.message.includes('Trust anchor')
  );
}

function isNetworkFailure(err: unknown): boolean {
  if (isSslTrustError(err)) return false;
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      err.name === 'AbortError' ||
      err.message === 'Network request failed' ||
      err.message.includes('Failed to fetch') ||
      err.message === 'Network Error' ||
      err.message.includes('Unable to resolve host') ||
      err.message.includes('No address associated with hostname') ||
      message.includes('connection closed')
    );
  }
  return false;
}

function isDnsFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('Unable to resolve host') ||
    err.message.includes('No address associated with hostname')
  );
}

function createTempPath(suffix: string): string {
  const cacheDir = FileSystem.cacheDirectory ?? '';
  return `${cacheDir}native-http-${Date.now()}-${Math.random().toString(36).slice(2)}.${suffix}`;
}

async function removeTempFile(path: string | null): Promise<void> {
  if (!path) return;
  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch {
    // ignore cleanup errors
  }
}

function parseJsonBody<T>(raw: string): T {
  if (!raw.trim()) return undefined as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

function parseErrorData(raw: string): { error?: string } {
  try {
    return JSON.parse(raw) as { error?: string };
  } catch {
    return {};
  }
}

function throwHttpError(status: number, rawBody: string): never {
  throw new HttpError(`Request failed with status ${status}`, {
    response: { status, data: parseErrorData(rawBody) },
  });
}

/** XMLHttpRequest — стабильнее fetch на Android через общий OkHttp-клиент */
function xhrJson<T>(
  method: HttpMethod,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  body?: string | null,
): Promise<NativeHttpResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = timeoutMs;
    xhr.responseType = 'text';

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'content-type' && body == null) continue;
      try {
        xhr.setRequestHeader(key, value);
      } catch {
        // ignore duplicate or forbidden headers
      }
    }

    xhr.onload = () => {
      const raw = xhr.responseText ?? '';
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new HttpError(`Request failed with status ${xhr.status}`, {
            response: { status: xhr.status, data: parseErrorData(raw) },
          }),
        );
        return;
      }
      resolve({ status: xhr.status, data: parseJsonBody<T>(raw) });
    };

    xhr.onerror = () => {
      reject(new HttpError('Network request failed', { code: 'ERR_NETWORK' }));
    };

    xhr.ontimeout = () => {
      reject(new HttpError('timeout', { code: 'ECONNABORTED' }));
    };

    xhr.onabort = () => {
      reject(new HttpError('timeout', { code: 'ECONNABORTED' }));
    };

    xhr.send(body ?? undefined);
  });
}

async function downloadJson<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<NativeHttpResult<T>> {
  const target = createTempPath('json');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await FileSystem.downloadAsync(url, target, { headers });
      const raw = await FileSystem.readAsStringAsync(target);
      if (result.status < 200 || result.status >= 300) {
        throwHttpError(result.status, raw);
      }
      return { status: result.status, data: parseJsonBody<T>(raw) };
    } finally {
      clearTimeout(timer);
    }
  } finally {
    await removeTempFile(target);
  }
}

async function requestWithRetry<T>(
  method: HttpMethod,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  body?: string | null,
  attempt = 0,
): Promise<NativeHttpResult<T>> {
  try {
    return await xhrJson<T>(method, url, headers, timeoutMs, body);
  } catch (err) {
    if (err instanceof HttpError && err.response) throw err;
    if (isSslTrustError(err)) {
      throw new HttpError(err instanceof Error ? err.message : 'SSL trust error', {
        code: 'ERR_SSL',
      });
    }
    if (isDnsFailure(err)) {
      throw new HttpError(err instanceof Error ? err.message : 'DNS resolution failed', {
        code: 'ERR_DNS',
      });
    }
    if (attempt < 2 && isNetworkFailure(err)) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      return requestWithRetry<T>(method, url, headers, timeoutMs, body, attempt + 1);
    }
    if (method === 'GET' && isNetworkFailure(err)) {
      return downloadJson<T>(url, headers, timeoutMs);
    }
    throw err instanceof HttpError
      ? err
      : new HttpError(err instanceof Error ? err.message : 'Network Error', {
          code: 'ERR_NETWORK',
        });
  }
}

export async function nativeGetJson<T>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  return requestWithRetry<T>('GET', url, { Accept: 'application/json', ...headers }, timeoutMs);
}

export async function nativePostJson<T>(
  url: string,
  body: unknown | string | undefined,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };
  const jsonBody =
    body == null
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  if (jsonBody != null) {
    requestHeaders['Content-Type'] =
      requestHeaders['Content-Type'] ?? requestHeaders['content-type'] ?? 'application/json';
  }
  return requestWithRetry<T>('POST', url, requestHeaders, timeoutMs, jsonBody ?? null);
}

export async function nativePutJson<T>(
  url: string,
  body: unknown | string | undefined,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const jsonBody =
    body == null
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  return requestWithRetry<T>(
    'PUT',
    url,
    { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
    timeoutMs,
    jsonBody,
  );
}

export async function nativePatchJson<T>(
  url: string,
  body: unknown | string | undefined,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const jsonBody =
    body == null
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  return requestWithRetry<T>(
    'PATCH',
    url,
    { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
    timeoutMs,
    jsonBody,
  );
}

export async function nativeDeleteJson<T = void>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  return requestWithRetry<T>('DELETE', url, { Accept: 'application/json', ...headers }, timeoutMs);
}

function xhrFormData<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  formData: FormData,
): Promise<NativeHttpResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = timeoutMs;
    xhr.responseType = 'text';

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'content-type') continue;
      try {
        xhr.setRequestHeader(key, value);
      } catch {
        // ignore duplicate or forbidden headers
      }
    }

    xhr.onload = () => {
      const raw = xhr.responseText ?? '';
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new HttpError(`Request failed with status ${xhr.status}`, {
            response: { status: xhr.status, data: parseErrorData(raw) },
          }),
        );
        return;
      }
      resolve({ status: xhr.status, data: parseJsonBody<T>(raw) });
    };

    xhr.onerror = () => {
      reject(new HttpError('Network request failed', { code: 'ERR_NETWORK' }));
    };

    xhr.ontimeout = () => {
      reject(new HttpError('timeout', { code: 'ECONNABORTED' }));
    };

    xhr.onabort = () => {
      reject(new HttpError('timeout', { code: 'ECONNABORTED' }));
    };

    xhr.send(formData);
  });
}

export async function nativeSendFormData<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  formData: FormData,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  try {
    return await xhrFormData<T>(method, url, { Accept: 'application/json', ...headers }, timeoutMs, formData);
  } catch (err) {
    if (err instanceof HttpError && err.response) throw err;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: { Accept: 'application/json', ...headers },
        body: formData,
        signal: controller.signal,
      });
      const raw = await response.text();
      if (!response.ok) throwHttpError(response.status, raw);
      return { status: response.status, data: parseJsonBody<T>(raw) };
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function nativeDownloadBlob(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<Blob>> {
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const raw = await response.text();
      throwHttpError(response.status, raw);
    }
    const data = await response.blob();
    return { status: response.status, data };
  } catch (err) {
    if (err instanceof HttpError && err.response) throw err;
    const target = createTempPath('bin');
    try {
      const result = await FileSystem.downloadAsync(url, target, { headers });
      if (result.status < 200 || result.status >= 300) {
        const raw = await FileSystem.readAsStringAsync(target);
        throwHttpError(result.status, raw);
      }
      const base64 = await FileSystem.readAsStringAsync(target, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const data = await fetch(`data:${result.mimeType ?? 'application/octet-stream'};base64,${base64}`).then(
        (r) => r.blob(),
      );
      return { status: result.status, data };
    } finally {
      await removeTempFile(target);
    }
  }
}
