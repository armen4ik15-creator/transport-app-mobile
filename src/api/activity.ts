import { api } from './client';
import type { ActivityLogItem } from '../types';

export async function listActivity(): Promise<ActivityLogItem[]> {
  const { data } = await api.get<ActivityLogItem[]>('/activity');
  return data;
}
