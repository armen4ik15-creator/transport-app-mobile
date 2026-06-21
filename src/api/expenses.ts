import { api } from './client';
import type { ExpenseMethod, ExpenseRecord } from '../types';

export async function listExpenses(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
  status?: string;
}): Promise<ExpenseRecord[]> {
  const { data } = await api.get<ExpenseRecord[]>('/expenses', { params });
  return data;
}

export async function createExpense(payload: {
  exp_date?: string;
  exp_type?: string;
  method?: ExpenseMethod;
  amount: number;
  comment?: string;
  driver_id?: number;
  car_number?: string;
}): Promise<ExpenseRecord> {
  const { data } = await api.post<ExpenseRecord>('/expenses', payload);
  return data;
}

export async function createExpenseWithPhoto(payload: {
  exp_date: string;
  exp_type: string;
  amount: number;
  comment?: string;
  driver_id?: number;
  car_number?: string;
  photoUri: string;
}): Promise<ExpenseRecord> {
  const formData = new FormData();
  formData.append('exp_date', payload.exp_date);
  formData.append('exp_type', payload.exp_type);
  formData.append('amount', String(payload.amount));
  if (payload.comment) formData.append('comment', payload.comment);
  if (payload.driver_id != null) formData.append('driver_id', String(payload.driver_id));
  if (payload.car_number) formData.append('car_number', payload.car_number);

  const fileName = payload.photoUri.split('/').pop() ?? 'photo.jpg';
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeType =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  formData.append('photo', {
    uri: payload.photoUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await api.post<ExpenseRecord>('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function approveExpense(id: number): Promise<ExpenseRecord> {
  const { data } = await api.patch<ExpenseRecord>(`/expenses/${id}/review`, {
    action: 'approve',
  });
  return data;
}

export async function rejectExpense(id: number, rejectionReason: string): Promise<ExpenseRecord> {
  const { data } = await api.patch<ExpenseRecord>(`/expenses/${id}/review`, {
    action: 'reject',
    rejection_reason: rejectionReason,
  });
  return data;
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
