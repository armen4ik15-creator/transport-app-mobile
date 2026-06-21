import * as FileSystem from 'expo-file-system/legacy';
import { getApiBaseUrl, getServerHost } from '../api/client';
import { getStoredToken } from '../storage/sessionStorage';

function cacheFileName(filePath: string): string {
  return `photo_${filePath.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

/** Прямой URL (статика /uploads) — может не работать за nginx. */
export async function buildDirectPhotoUrl(filePath: string): Promise<string> {
  const host = await getServerHost();
  return `${host}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
}

/** URL через API с авторизацией — надёжный способ для мобильного клиента. */
export async function buildApiPhotoUrl(filePath: string): Promise<string> {
  const apiBase = await getApiBaseUrl();
  return `${apiBase}/photos/file?path=${encodeURIComponent(filePath)}`;
}

/**
 * Скачивает фото в кэш с Bearer-токеном и возвращает локальный URI для <Image />.
 * Сначала пробует API-маршрут, затем прямой /uploads.
 */
export async function resolvePhotoLocalUri(filePath: string): Promise<string> {
  if (!filePath?.trim()) {
    throw new Error('Путь к файлу не указан');
  }

  const token = await getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const targetUri = `${FileSystem.cacheDirectory ?? ''}${cacheFileName(filePath)}`;

  const candidates = [await buildApiPhotoUrl(filePath), await buildDirectPhotoUrl(filePath)];

  let lastError: Error | null = null;
  for (const url of candidates) {
    try {
      const result = await FileSystem.downloadAsync(url, targetUri, { headers });
      if (result.status === 200) {
        return result.uri;
      }
      lastError = new Error(`HTTP ${result.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Download failed');
    }
  }

  throw lastError ?? new Error('Не удалось загрузить фото');
}

/** Скачать фото для «Поделиться» / экспорта. */
export async function downloadPhotoForShare(filePath: string, photoId: number): Promise<string> {
  const ext = filePath.split('.').pop() ?? 'jpg';
  const targetUri = `${FileSystem.cacheDirectory ?? ''}ttn_${photoId}.${ext}`;
  const token = await getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const urls = [await buildApiPhotoUrl(filePath), await buildDirectPhotoUrl(filePath)];
  for (const url of urls) {
    const result = await FileSystem.downloadAsync(url, targetUri, { headers });
    if (result.status === 200) {
      return result.uri;
    }
  }
  throw new Error('Сервер вернул 404 — файл не найден. Обновите сервер до последней версии.');
}
