import { api } from './client';
import type { Driver } from '../types';

export async function listDrivers(): Promise<Driver[]> {
  const { data } = await api.get<Driver[]>('/drivers');
  return data;
}

export async function createDriver(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  car_number?: string;
  license_number?: string;
  license_expiry?: string;
  medical_check_expiry?: string;
  is_active?: boolean;
}): Promise<Driver> {
  const { data } = await api.post<Driver>('/drivers', payload);
  return data;
}

export async function updateDriver(
  id: number,
  payload: {
    full_name?: string;
    phone?: string | null;
    car_number?: string | null;
    license_number?: string | null;
    license_expiry?: string | null;
    medical_check_expiry?: string | null;
    is_active?: boolean;
    password?: string;
  }
): Promise<Driver> {
  const { data } = await api.put<Driver>(`/drivers/${id}`, payload);
  return data;
}

export async function deleteDriver(id: number): Promise<void> {
  await api.delete(`/drivers/${id}`);
}

export async function updateMyDriverProfile(payload: {
  full_name?: string;
  phone?: string;
  car_number?: string;
  license_number?: string;
  license_expiry?: string;
  medical_check_expiry?: string;
}): Promise<Driver> {
  const { data } = await api.put<Driver>('/drivers/profile/me', payload);
  return data;
}
