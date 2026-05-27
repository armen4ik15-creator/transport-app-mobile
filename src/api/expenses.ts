import { api } from './client';
import type { ExpenseMethod, ExpenseRecord } from '../types';

export async function listExpenses(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
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

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
