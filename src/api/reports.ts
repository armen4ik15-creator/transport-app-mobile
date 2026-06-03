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
  trips_count?: number;
  revenue?: number;
  driver_pay?: number;
  profit?: number;
}

export interface ReportDailyRow {
  date: string;
  trips_count: number;
  revenue: number;
  driver_pay: number;
  expenses: number;
  expenses_count: number;
  costs: number;
  profit: number;
}

export interface ReportDailyResponse {
  days: ReportDailyRow[];
  totals: {
    trips_count: number;
    revenue: number;
    driver_pay: number;
    expenses: number;
    costs: number;
    profit: number;
  };
}

export async function getReportSummary(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
}): Promise<ReportSummary> {
  const { data } = await api.get<ReportSummary>('/reports/summary', { params });
  return data;
}

export async function getReportDaily(params: {
  from: string;
  to: string;
  driver_id?: number;
}): Promise<ReportDailyResponse> {
  const { data } = await api.get<ReportDailyResponse>('/reports/daily', { params });
  return data;
}
