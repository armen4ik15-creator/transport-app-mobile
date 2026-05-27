import { api } from './client';
import type { NotificationItem } from '../types';

export async function listNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[]>('/notifications');
  return data;
}

export async function createNotification(payload: {
  user_id: number;
  message: string;
}): Promise<NotificationItem> {
  const { data } = await api.post<NotificationItem>('/notifications', payload);
  return data;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const { data } = await api.put<NotificationItem>(`/notifications/${id}/read`);
  return data;
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
