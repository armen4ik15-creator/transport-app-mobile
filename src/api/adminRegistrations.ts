import { api } from './client';
import type { AdminRegistrationRequest } from '../types';

export async function listAdminRegistrationRequests(): Promise<AdminRegistrationRequest[]> {
  const { data } = await api.get<AdminRegistrationRequest[]>('/admin-registrations');
  return data;
}

export async function getAdminRegistrationRequest(id: number): Promise<AdminRegistrationRequest> {
  const { data } = await api.get<AdminRegistrationRequest>(`/admin-registrations/${id}`);
  return data;
}

export async function approveAdminRegistration(
  id: number
): Promise<{ ok: boolean; message: string; request: AdminRegistrationRequest; user_id: number }> {
  const { data } = await api.post<{
    ok: boolean;
    message: string;
    request: AdminRegistrationRequest;
    user_id: number;
  }>(`/admin-registrations/${id}/approve`);
  return data;
}

export async function rejectAdminRegistration(
  id: number,
  reason?: string
): Promise<{ ok: boolean; message: string; request: AdminRegistrationRequest }> {
  const { data } = await api.post<{
    ok: boolean;
    message: string;
    request: AdminRegistrationRequest;
  }>(`/admin-registrations/${id}/reject`, { reason });
  return data;
}

export async function countPendingAdminRegistrations(): Promise<number> {
  const rows = await listAdminRegistrationRequests();
  return rows.filter((row) => row.status === 'pending').length;
}
