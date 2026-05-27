import { api } from './client';
import type { Vehicle } from '../types';

export async function listVehicles(): Promise<Vehicle[]> {
  const { data } = await api.get<Vehicle[]>('/vehicles');
  return data;
}

export async function createVehicle(payload: {
  plate_number: string;
  model?: string;
  capacity?: number | null;
}): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>('/vehicles', payload);
  return data;
}

export async function updateVehicle(
  id: number,
  payload: { plate_number?: string; model?: string; capacity?: number | null }
): Promise<Vehicle> {
  const { data } = await api.put<Vehicle>(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
