import { api } from './client';
import type { Order } from '../types';

export interface DashboardStats {
  active_orders: number;
  drivers_online: number;
  unread_notifications: number;
  total_debt: number;
  recent_orders: Order[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}
