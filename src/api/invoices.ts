import { api } from './client';
import type { Invoice } from '../types';

export async function listInvoices(orderId?: number): Promise<Invoice[]> {
  const { data } = await api.get<Invoice[]>('/invoices', {
    params: orderId ? { order_id: orderId } : undefined,
  });
  return data;
}

export async function createInvoice(payload: {
  order_id: number;
  number: string;
  date?: string;
  amount?: number | null;
  fileUri?: string | null;
}): Promise<Invoice> {
  const formData = new FormData();
  formData.append('order_id', String(payload.order_id));
  formData.append('number', payload.number);
  if (payload.date) formData.append('date', payload.date);
  if (payload.amount != null) formData.append('amount', String(payload.amount));
  if (payload.fileUri) {
    formData.append('file', {
      uri: payload.fileUri,
      name: `invoice_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await api.post<Invoice>('/invoices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}`);
}
