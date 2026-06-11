import { api } from './client';
import type { ContractorDebtSummary, ContractorPaymentRecord } from '../types';

export async function listContractorPayments(contractorId?: number): Promise<ContractorPaymentRecord[]> {
  const { data } = await api.get<ContractorPaymentRecord[]>('/contractors/payments', {
    params: contractorId ? { contractor_id: contractorId } : undefined,
  });
  return data;
}

export async function createContractorPayment(payload: {
  contractor_id: number;
  amount: number;
  payment_date?: string;
  note?: string;
}): Promise<ContractorPaymentRecord> {
  const { data } = await api.post<ContractorPaymentRecord>('/contractors/payments', payload);
  return data;
}

export async function getContractorDebtSummary(): Promise<ContractorDebtSummary[]> {
  const { data } = await api.get<ContractorDebtSummary[]>('/contractors/summary');
  return data;
}

export async function deleteContractorPayment(id: number): Promise<void> {
  await api.delete(`/contractors/payments/${id}`);
}
