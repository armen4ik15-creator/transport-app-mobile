import { api } from './client';
import type { DocumentRecord } from '../types';

export async function listDocuments(orderId?: number): Promise<DocumentRecord[]> {
  const { data } = await api.get<DocumentRecord[]>('/documents', {
    params: orderId ? { order_id: orderId } : undefined,
  });
  return data;
}

export async function uploadDocument(payload: {
  order_id: number;
  type: 'waybill' | 'invoice' | 'act';
  fileUri: string;
}): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append('order_id', String(payload.order_id));
  formData.append('type', payload.type);
  formData.append('file', {
    uri: payload.fileUri,
    name: `document_${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data } = await api.post<DocumentRecord>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}
