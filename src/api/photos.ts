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
