import { api } from './client';
import type { Contractor } from '../types';

export async function listContractors(): Promise<Contractor[]> {
  const { data } = await api.get<Contractor[]>('/contractors');
  return data;
}

export async function createContractor(payload: {
  name: string;
  type?: string;
  phone?: string;
  address?: string;
}): Promise<Contractor> {
  const { data } = await api.post<Contractor>('/contractors', payload);
  return data;
}

export async function updateContractor(
  id: number,
  payload: { name?: string; type?: string; phone?: string | null; address?: string | null }
): Promise<Contractor> {
  const { data } = await api.put<Contractor>(`/contractors/${id}`, payload);
  return data;
}

export async function deleteContractor(id: number): Promise<void> {
  await api.delete(`/contractors/${id}`);
}
