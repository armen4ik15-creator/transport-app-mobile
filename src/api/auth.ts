import { api } from './client';
import type { Driver, User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerDriver(payload: {
  email: string;
  password: string;
  role?: 'admin' | 'driver';
  full_name?: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  medical_check_expiry?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function getMe(): Promise<{ user: User; driver: Driver | null }> {
  const { data } = await api.get<{ user: User; driver: Driver | null }>('/auth/me');
  return data;
}
