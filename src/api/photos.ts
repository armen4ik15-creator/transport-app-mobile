import { api } from './client';
import type { TtnPhotoRecord } from '../types';

export interface GetAllPhotosParams {
  driver_id?: number;
  order_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export async function getAllPhotos(params?: GetAllPhotosParams): Promise<TtnPhotoRecord[]> {
  const { data } = await api.get<TtnPhotoRecord[]>('/photos', { params });
  return data;
}

export function dedupePhotoRecords(items: TtnPhotoRecord[]): TtnPhotoRecord[] {
  const seen = new Set<string>();
  return items.filter((photo) => {
    const key = `${photo.source}:${photo.trip_id ?? photo.id}:${photo.file_path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
