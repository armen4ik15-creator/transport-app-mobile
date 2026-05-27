import { api } from './client';
import type { Waybill } from '../types';

export async function listWaybills(orderId?: number): Promise<Waybill[]> {
  const { data } = await api.get<Waybill[]>('/waybills', {
    params: orderId ? { order_id: orderId } : undefined,
  });
  return data;
}

export async function createWaybill(payload: {
  order_id: number;
  number: string;
  date?: string;
  fileUri?: string | null;
}): Promise<Waybill> {
  const formData = new FormData();
  formData.append('order_id', String(payload.order_id));
  formData.append('number', payload.number);
  if (payload.date) formData.append('date', payload.date);
  if (payload.fileUri) {
    formData.append('file', {
      uri: payload.fileUri,
      name: `waybill_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await api.post<Waybill>('/waybills', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

export async function deleteWaybill(id: number): Promise<void> {
  await api.delete(`/waybills/${id}`);
}
