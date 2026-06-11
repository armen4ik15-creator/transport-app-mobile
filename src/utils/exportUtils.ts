import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getApiBaseUrl } from '../api/client';
import { getStoredToken } from '../storage/sessionStorage';

export function buildExportQuery(
  params: Record<string, string | number | undefined | null>
): string {
  const query = Object.entries(params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

export async function downloadAndShareExcel(apiPath: string, filename: string): Promise<void> {
  try {
    const apiBase = await getApiBaseUrl();
    const token = await getStoredToken();
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const url = `${apiBase}${normalizedPath}`;
    const targetUri = `${FileSystem.cacheDirectory ?? ''}${filename}`;

    const result = await FileSystem.downloadAsync(url, targetUri, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (result.status !== 200) {
      throw new Error(`Сервер вернул код ${result.status}`);
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Готово', `Файл сохранён:\n${result.uri}`);
      return;
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: filename,
      UTI: 'com.microsoft.excel.xlsx',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Не удалось скачать Excel-файл';
    Alert.alert(
      'Ошибка экспорта',
      `${message}\n\nУбедитесь, что сервер обновлён и поддерживает /api/export/*`
    );
  }
}
