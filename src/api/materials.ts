import { api } from './client';
import type { Material } from '../types';

export async function listMaterials(): Promise<Material[]> {
  const { data } = await api.get<Material[]>('/materials');
  return data;
}

export async function createMaterial(payload: {
  name: string;
  unit?: string;
  price_per_ton?: number | null;
}): Promise<Material> {
  const { data } = await api.post<Material>('/materials', payload);
  return data;
}

export async function updateMaterial(
  id: number,
  payload: { name?: string; unit?: string; price_per_ton?: number | null }
): Promise<Material> {
  const { data } = await api.put<Material>(`/materials/${id}`, payload);
  return data;
}

export async function deleteMaterial(id: number): Promise<void> {
  await api.delete(`/materials/${id}`);
}
