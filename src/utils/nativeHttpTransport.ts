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

type FormDataPart = [string, string | { uri: string; name?: string; type?: string }];

interface ParsedFormData {
  parameters: Record<string, string>;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  fieldName?: string;
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new HttpError(`${label} timeout`, { code: 'ECONNABORTED' }));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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

async function fetchJson<T>(
  method: HttpMethod,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  body?: BodyInit,
): Promise<NativeHttpResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : body,
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) {
      throwHttpError(response.status, raw);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? parseJsonBody<T>(raw) : (raw as T);
    return { status: response.status, data };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function downloadJson<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<NativeHttpResult<T>> {
  const target = createTempPath('json');
  try {
    const result = await withTimeout(
      FileSystem.downloadAsync(url, target, { headers }),
      timeoutMs,
      'GET',
    );
    const raw = await FileSystem.readAsStringAsync(target);
    if (result.status < 200 || result.status >= 300) {
      throwHttpError(result.status, raw);
    }
    return { status: result.status, data: parseJsonBody<T>(raw) };
  } finally {
    await removeTempFile(target);
  }
}

async function uploadJson<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  jsonBody: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<NativeHttpResult<T>> {
  const source = createTempPath('json');
  try {
    await FileSystem.writeAsStringAsync(source, jsonBody);
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];
    delete uploadHeaders['content-type'];

    const result = await withTimeout(
      FileSystem.uploadAsync(url, source, {
        httpMethod: method,
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          ...uploadHeaders,
          'Content-Type': headers['Content-Type'] ?? headers['content-type'] ?? 'application/json',
        },
      }),
      timeoutMs,
      method,
    );

    if (result.status < 200 || result.status >= 300) {
      throwHttpError(result.status, result.body);
    }

    return { status: result.status, data: parseJsonBody<T>(result.body) };
  } finally {
    await removeTempFile(source);
  }
}

function parseFormData(formData: FormData): ParsedFormData {
  const parts =
    (formData as unknown as { _parts?: FormDataPart[] })._parts ?? [];
  const parameters: Record<string, string> = {};
  let fileUri: string | undefined;
  let fileName: string | undefined;
  let mimeType: string | undefined;
  let fieldName: string | undefined;

  for (const [name, value] of parts) {
    if (typeof value === 'object' && value !== null && 'uri' in value) {
      fileUri = value.uri;
      fileName = value.name ?? 'file';
      mimeType = value.type ?? 'application/octet-stream';
      fieldName = name;
      continue;
    }
    parameters[name] = String(value);
  }

  return { parameters, fileUri, fileName, mimeType, fieldName };
}

async function uploadMultipart<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  formData: FormData,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<NativeHttpResult<T>> {
  const parsed = parseFormData(formData);
  if (!parsed.fileUri || !parsed.fieldName) {
    throw new HttpError('FormData fallback requires a file part', { code: 'ERR_FORM_DATA' });
  }

  const uploadHeaders = { ...headers };
  delete uploadHeaders['Content-Type'];
  delete uploadHeaders['content-type'];

  const result = await withTimeout(
    FileSystem.uploadAsync(url, parsed.fileUri, {
      httpMethod: method,
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: parsed.fieldName,
      mimeType: parsed.mimeType,
      parameters: parsed.parameters,
      headers: uploadHeaders,
    }),
    timeoutMs,
    method,
  );

  if (result.status < 200 || result.status >= 300) {
    throwHttpError(result.status, result.body);
  }

  return { status: result.status, data: parseJsonBody<T>(result.body) };
}

async function requestWithFallback<T>(
  method: HttpMethod,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  options?: {
    jsonBody?: string;
    formData?: FormData;
    fetchBody?: BodyInit;
  },
): Promise<NativeHttpResult<T>> {
  try {
    return await fetchJson<T>(method, url, headers, timeoutMs, options?.fetchBody);
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
    if (!isNetworkFailure(err)) {
      throw err instanceof HttpError
        ? err
        : new HttpError(err instanceof Error ? err.message : 'Network Error', {
            code: 'ERR_NETWORK',
          });
    }

    if (method === 'GET') {
      return downloadJson<T>(url, headers, timeoutMs);
    }

    const message = err instanceof Error ? err.message : 'Network Error';
    throw new HttpError(message, { code: 'ERR_NETWORK' });
  }
}

export async function nativeGetJson<T>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  return requestWithFallback<T>('GET', url, headers, timeoutMs);
}

export async function nativePostJson<T>(
  url: string,
  body: unknown | undefined,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };
  if (body != null) {
    requestHeaders['Content-Type'] =
      requestHeaders['Content-Type'] ?? requestHeaders['content-type'] ?? 'application/json';
  }
  const jsonBody = body != null ? JSON.stringify(body) : undefined;
  return requestWithFallback<T>('POST', url, requestHeaders, timeoutMs, {
    jsonBody,
    fetchBody: jsonBody,
  });
}

export async function nativePutJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const jsonBody = JSON.stringify(body ?? {});
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };
  return requestWithFallback<T>('PUT', url, requestHeaders, timeoutMs, {
    jsonBody,
    fetchBody: jsonBody,
  });
}

export async function nativePatchJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const jsonBody = JSON.stringify(body ?? {});
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };
  return requestWithFallback<T>('PATCH', url, requestHeaders, timeoutMs, {
    jsonBody,
    fetchBody: jsonBody,
  });
}

export async function nativeDeleteJson<T = void>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  return requestWithFallback<T>('DELETE', url, { Accept: 'application/json', ...headers }, timeoutMs);
}

export async function nativeSendFormData<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  formData: FormData,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<T>> {
  const requestHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  delete requestHeaders['Content-Type'];
  delete requestHeaders['content-type'];
  return requestWithFallback<T>(method, url, requestHeaders, timeoutMs, {
    formData,
    fetchBody: formData,
  });
}

export async function nativeDownloadBlob(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 20_000,
): Promise<NativeHttpResult<Blob>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
      if (!response.ok) {
        const raw = await response.text();
        throwHttpError(response.status, raw);
      }
      const data = await response.blob();
      return { status: response.status, data };
    } finally {
      clearTimeout(timeoutId);
    }
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
    if (!isNetworkFailure(err)) {
      throw err instanceof HttpError
        ? err
        : new HttpError(err instanceof Error ? err.message : 'Network Error', { code: 'ERR_NETWORK' });
    }

    const target = createTempPath('bin');
    try {
      const result = await withTimeout(
        FileSystem.downloadAsync(url, target, { headers }),
        timeoutMs,
        'GET',
      );
      if (result.status < 200 || result.status >= 300) {
        const raw = await FileSystem.readAsStringAsync(target);
        throwHttpError(result.status, raw);
      }
      const base64 = await FileSystem.readAsStringAsync(target, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const data = await fetch(`data:${result.mimeType ?? 'application/octet-stream'};base64,${base64}`).then(
        (response) => response.blob(),
      );
      return { status: result.status, data };
    } finally {
      await removeTempFile(target);
    }
  }
}
