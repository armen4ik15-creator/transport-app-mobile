import { api } from './client';
import type { TripRecord, TripStage, TripStatus } from '../types';

export type TripAction = 'loading' | 'unloading';

export async function listTrips(params?: {
  order_id?: number;
  driver_id?: number;
  from?: string;
  to?: string;
  status?: TripStatus;
}): Promise<TripRecord[]> {
  const { data } = await api.get<TripRecord[]>('/trips', { params });
  return data;
}

export async function getTripsSummary(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
}): Promise<{ total_trips: number; total_volume: number; estimated_income: number }> {
  const { data } = await api.get<{ total_trips: number; total_volume: number; estimated_income: number }>(
    '/trips/summary',
    { params }
  );
  return data;
}

export async function createTrip(payload: {
  order_id: number;
  action: TripAction;
  ttn_number?: string;
  volume?: number | null;
  note?: string;
  photoUri?: string | null;
}): Promise<TripRecord> {
  const formData = new FormData();
  formData.append('order_id', String(payload.order_id));
  formData.append('action', payload.action);
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

export function isTripCompleted(trip: TripRecord): boolean {
  return trip.status === 'completed' || (trip.status == null && trip.stage === 'unloading');
}

export function isTripInProgress(trip: TripRecord): boolean {
  return trip.status === 'loading' || (trip.status == null && trip.stage === 'loading');
}

/** @deprecated use TripAction */
export type { TripStage };
