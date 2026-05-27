import { api } from './client';

export interface ReportSummary {
  orders_total: number;
  orders_completed: number;
  documents_total: number;
  expenses_total: number;
  expenses_amount: number;
  income: number;
  expense: number;
  balance: number;
}

export async function getReportSummary(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
}): Promise<ReportSummary> {
  const { data } = await api.get<ReportSummary>('/reports/summary', { params });
  return data;
}
