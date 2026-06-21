import { api } from './client';
import type { DriverRegistrationRequest } from '../types';

export async function listDriverRegistrationRequests(): Promise<DriverRegistrationRequest[]> {
  const { data } = await api.get<DriverRegistrationRequest[]>('/driver-registrations');
  return data;
}

export async function approveDriverRegistration(
  id: number
): Promise<{ ok: boolean; message: string; request: DriverRegistrationRequest }> {
  const { data } = await api.post<{ ok: boolean; message: string; request: DriverRegistrationRequest }>(
    `/driver-registrations/${id}/approve`
  );
  return data;
}

export async function rejectDriverRegistration(
  id: number,
  reason?: string
): Promise<{ ok: boolean; message: string; request: DriverRegistrationRequest }> {
  const { data } = await api.post<{ ok: boolean; message: string; request: DriverRegistrationRequest }>(
    `/driver-registrations/${id}/reject`,
    reason ? { reason } : undefined
  );
  return data;
}

export async function countPendingDriverRegistrations(): Promise<number> {
  const rows = await listDriverRegistrationRequests();
  return rows.filter((row) => row.status === 'pending').length;
}
