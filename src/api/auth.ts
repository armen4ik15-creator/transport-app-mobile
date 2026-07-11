import { api, resetAuthTokenCache } from './client';
import type { Driver, User } from '../types';

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
} as const;

async function postPublicAuth<T>(path: string, body: unknown): Promise<T> {
  resetAuthTokenCache();
  const { data } = await api.post<T>(path, body, {
    timeout: 35000,
    headers: JSON_HEADERS,
  });
  return data;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegistrationPendingResponse {
  pending: true;
  message: string;
}

export type RegisterDriverResult = AuthResponse | RegistrationPendingResponse;

export interface SecurityConfig {
  registration_open: boolean;
  registration_requires_invite: boolean;
  registration_available: boolean;
  admin_registration_available: boolean;
  password_reset_available: boolean;
  password_reset_requires_code: boolean;
}

export async function getSecurityConfig(): Promise<SecurityConfig> {
  const { data } = await api.get<SecurityConfig>('/auth/security-config');
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return postPublicAuth<AuthResponse>('/auth/login', { email, password });
}

export async function registerDriver(payload: {
  email: string;
  password: string;
  confirm_password?: string;
  role?: 'driver';
  full_name?: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  medical_check_expiry?: string;
  invite_code?: string;
}): Promise<RegisterDriverResult> {
  return postPublicAuth<RegisterDriverResult>('/auth/register', { ...payload, role: 'driver' });
}

export async function registerAdmin(payload: {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
}): Promise<RegistrationPendingResponse> {
  return postPublicAuth<RegistrationPendingResponse>('/auth/register', {
    ...payload,
    role: 'admin',
  });
}

export async function forgotPassword(payload: {
  email: string;
  reset_code?: string;
  new_password: string;
}): Promise<{ ok: boolean; message: string }> {
  return postPublicAuth<{ ok: boolean; message: string }>('/auth/forgot-password', payload);
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
