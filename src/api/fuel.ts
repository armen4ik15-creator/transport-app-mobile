import { api } from './client';
import type {
  FuelCardRecord,
  FuelDataSourceType,
  FuelSyncLogRecord,
  FuelSyncStatus,
  FuelTransactionRecord,
} from '../types';

export async function getFuelSyncStatus(): Promise<FuelSyncStatus> {
  const { data } = await api.get<FuelSyncStatus>('/fuel/sync-status');
  return data;
}

export async function getFuelSettings(): Promise<FuelSyncStatus> {
  const { data } = await api.get<FuelSyncStatus>('/fuel/settings');
  return data;
}

export async function updateFuelSettings(payload: {
  data_source?: FuelDataSourceType;
  opti_login?: string;
  opti_password?: string;
  sync_enabled?: boolean;
  sync_interval_minutes?: number;
}): Promise<FuelSyncStatus> {
  const { data } = await api.put<FuelSyncStatus>('/fuel/settings', payload);
  return data;
}

export async function triggerFuelSync(): Promise<{
  ok: boolean;
  created: number;
  fetched: number;
  error?: string;
}> {
  const { data } = await api.post('/fuel/sync');
  return data;
}

export async function testFuelConnection(): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post<{ ok: boolean; message: string }>('/fuel/test-connection');
  return data;
}

export async function listFuelTransactions(params?: {
  from?: string;
  to?: string;
  driver_id?: number;
}): Promise<FuelTransactionRecord[]> {
  const { data } = await api.get<FuelTransactionRecord[]>('/fuel/transactions', { params });
  return data;
}

export async function listFuelCards(): Promise<FuelCardRecord[]> {
  const { data } = await api.get<FuelCardRecord[]>('/fuel/cards');
  return data;
}

export async function createFuelCard(payload: {
  driver_id: number;
  card_number: string;
  label?: string;
}): Promise<FuelCardRecord> {
  const { data } = await api.post<FuelCardRecord>('/fuel/cards', payload);
  return data;
}

export async function deleteFuelCard(id: number): Promise<void> {
  await api.delete(`/fuel/cards/${id}`);
}

export async function listFuelSyncLogs(limit = 10): Promise<FuelSyncLogRecord[]> {
  const { data } = await api.get<FuelSyncLogRecord[]>('/fuel/sync-logs', { params: { limit } });
  return data;
}
