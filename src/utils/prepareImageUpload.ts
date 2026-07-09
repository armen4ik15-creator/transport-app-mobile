import * as FileSystem from 'expo-file-system/legacy';

export interface PreparedImageUpload {
  uri: string;
  name: string;
  type: string;
}

function resolveMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/jpeg';
  return 'image/jpeg';
}

/** Копирует content:// в cache и подбирает mime — стабильнее для multipart на Android. */
export async function prepareImageUpload(uri: string): Promise<PreparedImageUpload> {
  const source = uri.trim();
  if (!source) {
    throw new Error('Фото не выбрано');
  }

  let uploadUri = source;
  if (source.startsWith('content://')) {
    const ext = source.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('Нет доступа к кэшу устройства');
    }
    const target = `${cacheDir}upload_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: source, to: target });
    uploadUri = target;
  }

  const fileName = uploadUri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
  return {
    uri: uploadUri,
    name: fileName,
    type: resolveMimeType(fileName),
  };
}
