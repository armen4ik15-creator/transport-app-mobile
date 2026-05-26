import { api } from './client';
import type { DriverBalance, FinanceRecord } from '../types';

export async function listFinances(driverId?: number): Promise<FinanceRecord[]> {
  const { data } = await api.get<FinanceRecord[]>('/finances', {
    params: driverId ? { driver_id: driverId } : undefined,
  });
  return data;
}

export async function createFinance(payload: {
  driver_id: number;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  order_id?: number | null;
}): Promise<FinanceRecord> {
  const { data } = await api.post<FinanceRecord>('/finances', payload);
  return data;
}

export async function getDriverBalance(driverId: number): Promise<DriverBalance> {
  const { data } = await api.get<DriverBalance>(`/drivers/${driverId}/balance`);
  return data;
}
