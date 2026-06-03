import { api } from './client';
import type { Driver, User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SecurityConfig {
  registration_open: boolean;
  registration_requires_invite: boolean;
  registration_available: boolean;
  password_reset_available: boolean;
}

export async function getSecurityConfig(): Promise<SecurityConfig> {
  const { data } = await api.get<SecurityConfig>('/auth/security-config');
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerDriver(payload: {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  medical_check_expiry?: string;
  invite_code?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function forgotPassword(payload: {
  email: string;
  reset_code: string;
  new_password: string;
}): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post<{ ok: boolean; message: string }>('/auth/forgot-password', payload);
  return data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post<{ ok: boolean; message: string }>('/auth/change-password', payload);
  return data;
}

export async function getMe(): Promise<{ user: User; driver: Driver | null }> {
  const { data } = await api.get<{ user: User; driver: Driver | null }>('/auth/me');
  return data;
}
