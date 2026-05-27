import { api } from './client';
import type { TripRecord, TripStage } from '../types';

export async function listTrips(params?: {
  order_id?: number;
  driver_id?: number;
  from?: string;
  to?: string;
}): Promise<TripRecord[]> {
  const { data } = await api.get<TripRecord[]>('/trips', { params });
  return data;
}

export async function createTrip(payload: {
  order_id: number;
  stage: TripStage;
  ttn_number?: string;
  volume?: number | null;
  note?: string;
  photoUri?: string | null;
}): Promise<TripRecord> {
  const formData = new FormData();
  formData.append('order_id', String(payload.order_id));
  formData.append('stage', payload.stage);
  if (payload.ttn_number) formData.append('ttn_number', payload.ttn_number);
  if (payload.volume != null) formData.append('volume', String(payload.volume));
  if (payload.note) formData.append('note', payload.note);
  if (payload.photoUri) {
    formData.append('photo', {
      uri: payload.photoUri,
      name: `trip_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  const { data } = await api.post<TripRecord>('/trips', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}
