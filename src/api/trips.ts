import { api, uploadMultipartFile } from './client';
import type { TripRecord, TripStage, TripStatus } from '../types';
import { prepareImageUpload, readImageAsBase64 } from '../utils/prepareImageUpload';

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
  if (!payload.photoUri) {
    const jsonPayload: Record<string, unknown> = {
      order_id: payload.order_id,
      action: payload.action,
    };
    if (payload.ttn_number) jsonPayload.ttn_number = payload.ttn_number;
    if (payload.volume != null) jsonPayload.volume = payload.volume;
    if (payload.note) jsonPayload.note = payload.note;

    const { data } = await api.post<TripRecord>('/trips', jsonPayload, { timeout: 30000 });
    return data;
  }

  const image = await prepareImageUpload(payload.photoUri);
  const { data } = await uploadMultipartFile<TripRecord>('/trips', image.uri, {
    fieldName: 'photo',
    mimeType: image.type,
    parameters: {
      order_id: String(payload.order_id),
      action: payload.action,
      ...(payload.ttn_number ? { ttn_number: payload.ttn_number } : {}),
      ...(payload.volume != null ? { volume: String(payload.volume) } : {}),
      ...(payload.note ? { note: payload.note } : {}),
    },
    timeout: 60000,
  });
  return data;
}

export async function deleteTrip(tripId: number): Promise<void> {
  await api.delete(`/trips/${tripId}`);
}

export function isTripCompleted(trip: TripRecord): boolean {
  return trip.status === 'completed' || (trip.status == null && trip.stage === 'unloading');
}

export function isTripInProgress(trip: TripRecord): boolean {
  return trip.status === 'loading' || (trip.status == null && trip.stage === 'loading');
}

export function hasTripPhoto(trip: TripRecord): boolean {
  return trip.photo_available === true;
}

export function isTripPhotoMissingOnServer(trip: TripRecord): boolean {
  return Boolean(trip.photo_path && trip.photo_path.trim() && trip.photo_available === false);
}

export function getTripPhotoButtonLabel(trip: TripRecord): string {
  if (isTripPhotoMissingOnServer(trip)) return '📷 Прикрепить фото ТТН заново';
  if (hasTripPhoto(trip)) return '📷 Изменить фото ТТН';
  return '📷 Прикрепить фото ТТН';
}

/** Показываем кнопку для любого завершённого рейса (включая зачтённые). */
export function canManageTripPhoto(trip: TripRecord): boolean {
  if (isTripCompleted(trip)) return true;
  return trip.stage === 'unloading' || trip.status === 'completed';
}

/** @deprecated use canManageTripPhoto */
export function needsTripPhotoAttach(trip: TripRecord): boolean {
  return canManageTripPhoto(trip);
}

export async function uploadTripPhoto(tripId: number, photoUri: string): Promise<TripRecord> {
  const { base64, mimeType } = await readImageAsBase64(photoUri);
  const { data } = await api.post<TripRecord>(
    `/trips/${tripId}/photo-data`,
    { image_data: base64, mime_type: mimeType },
    { timeout: 90000 },
  );
  return data;
}

export async function deleteTripPhoto(tripId: number): Promise<void> {
  await api.delete(`/trips/${tripId}/photo`);
}

/** @deprecated use TripAction */
export type { TripStage };
