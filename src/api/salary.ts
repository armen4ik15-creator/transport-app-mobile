import { api } from './client';
import type {
  DriverDebtSummary,
  DriverPaymentRecord,
  DriverPaymentType,
  DriverSalarySummary,
} from '../types';

export async function listSalaryPayments(driverId?: number): Promise<DriverPaymentRecord[]> {
  const { data } = await api.get<DriverPaymentRecord[]>('/salary/payments', {
    params: driverId ? { driver_id: driverId } : undefined,
  });
  return data;
}

export async function createSalaryPayment(payload: {
  driver_id: number;
  type: DriverPaymentType;
  amount: number;
  note?: string;
}): Promise<DriverPaymentRecord> {
  const { data } = await api.post<DriverPaymentRecord>('/salary/payments', payload);
  return data;
}

export async function getSalarySummary(driverId: number): Promise<DriverSalarySummary> {
  const { data } = await api.get<DriverSalarySummary>('/salary/summary', {
    params: { driver_id: driverId },
  });
  return data;
}

export async function getSalaryDebts(): Promise<DriverDebtSummary[]> {
  const { data } = await api.get<DriverDebtSummary[]>('/salary/debts');
  return data;
}

export async function deleteSalaryPayment(id: number): Promise<void> {
  await api.delete(`/salary/payments/${id}`);
}
