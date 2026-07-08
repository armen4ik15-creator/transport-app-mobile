import * as FileSystem from 'expo-file-system/legacy';
import { api, apiErrorMessage, getServerHost, isHttpError } from '../api/client';
import { getStoredToken } from '../storage/sessionStorage';

function cacheFileName(filePath: string): string {
  return `photo_${filePath.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

export function normalizePhotoPath(filePath: string): string {
  const trimmed = filePath.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (trimmed.startsWith('uploads/')) return `/${trimmed}`;
  if (trimmed.startsWith('/')) return `/uploads${trimmed}`;
  return `/uploads/${trimmed}`;
}

/** Прямой URL (статика /uploads) — запасной вариант без HMAC. */
export async function buildDirectPhotoUrl(filePath: string): Promise<string> {
  const host = await getServerHost();
  const normalized = normalizePhotoPath(filePath);
  return `${host}${normalized}`;
}

/** URL через API с авторизацией. */
export async function buildApiPhotoUrl(filePath: string): Promise<string> {
  const { getApiBaseUrl } = await import('../api/client');
  const apiBase = await getApiBaseUrl();
  const normalized = normalizePhotoPath(filePath);
  return `${apiBase}/photos/file?path=${encodeURIComponent(normalized)}`;
}

async function writeBlobToCache(blob: Blob, targetUri: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  const base64 = btoa(binary);
  await FileSystem.writeAsStringAsync(targetUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return targetUri;
}

async function readCachedFile(targetUri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(targetUri);
    if (info.exists && (info.size ?? 0) > 0) {
      return targetUri;
    }
  } catch {
    // ignore cache read errors
  }
  return null;
}

async function downloadViaStaticUrl(
  filePath: string,
  targetUri: string,
): Promise<string> {
  const token = await getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const result = await FileSystem.downloadAsync(await buildDirectPhotoUrl(filePath), targetUri, {
    headers,
  });
  if (result.status >= 200 && result.status < 300) {
    return result.uri;
  }
  throw new Error(`HTTP ${result.status}`);
}

async function downloadViaApiBlob(filePath: string, targetUri: string): Promise<string> {
  const normalized = normalizePhotoPath(filePath);
  const { data } = await api.get<Blob>('/photos/file', {
    params: { path: normalized },
    responseType: 'blob',
    timeout: 30_000,
  });
  return writeBlobToCache(data, targetUri);
}

async function downloadPhotoToCache(filePath: string, targetUri: string): Promise<string> {
  const cached = await readCachedFile(targetUri);
  if (cached) return cached;

  const normalized = normalizePhotoPath(filePath);
  const errors: string[] = [];

  try {
    return await downloadViaApiBlob(normalized, targetUri);
  } catch (error) {
    errors.push(isHttpError(error) ? apiErrorMessage(error, 'API') : 'API');
  }

  try {
    return await downloadViaStaticUrl(normalized, targetUri);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'static');
  }

  if (errors.some((item) => item.includes('404') || item.includes('не найден'))) {
    throw new Error(
      'Файл не найден на сервере. Возможно, фото потеряно при пересборке — прикрепите заново или восстановите из бэкапа.'
    );
  }

  throw new Error('Не удалось загрузить фото. Проверьте интернет и обновите приложение.');
}

/**
 * Скачивает фото через API (HMAC) с запасным /uploads и кладёт в кэш для <Image />.
 */
export async function resolvePhotoLocalUri(filePath: string): Promise<string> {
  if (!filePath?.trim()) {
    throw new Error('Путь к файлу не указан');
  }

  const targetUri = `${FileSystem.cacheDirectory ?? ''}${cacheFileName(normalizePhotoPath(filePath))}`;
  return downloadPhotoToCache(filePath, targetUri);
}

/** Скачать фото для «Поделиться» / экспорта. */
export async function downloadPhotoForShare(filePath: string, photoId: number): Promise<string> {
  const ext = normalizePhotoPath(filePath).split('.').pop() ?? 'jpg';
  const targetUri = `${FileSystem.cacheDirectory ?? ''}ttn_${photoId}.${ext}`;
  return downloadPhotoToCache(filePath, targetUri);
}
