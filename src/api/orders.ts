import { api } from './client';
import type { Order, OrderPhoto, OrderStatus, OrderWithPhotos } from '../types';

export async function listOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/orders');
  return data;
}

export async function getOrder(id: number): Promise<OrderWithPhotos> {
  const { data } = await api.get<OrderWithPhotos>(`/orders/${id}`);
  return data;
}

export async function createOrder(payload: {
  driver_id: number;
  contractor_id: number;
  task_name?: string;
  sender?: string;
  receiver?: string;
  total_planned_volume?: number | null;
  material?: string;
  quantity?: number | null;
  unit?: string;
  notes?: string;
  driver_rate?: number | null;
  company_rate?: number | null;
  distance_km?: number | null;
  is_active?: boolean;
  description?: string;
  load_address?: string;
  unload_address?: string;
  amount?: number | null;
}): Promise<Order> {
  const { data } = await api.post<Order>('/orders', payload);
  return data;
}

export async function createOrdersBulk(payload: {
  driver_ids: number[];
  contractor_id: number;
  task_name?: string;
  sender?: string;
  receiver?: string;
  total_planned_volume?: number | null;
  material?: string;
  quantity?: number | null;
  unit?: string;
  notes?: string;
  driver_rate?: number | null;
  company_rate?: number | null;
  distance_km?: number | null;
  is_active?: boolean;
  description?: string;
  load_address?: string;
  unload_address?: string;
  amount?: number | null;
}): Promise<Order[]> {
  const { data } = await api.post<Order[]>('/orders/bulk', payload);
  return data;
}

export async function updateOrder(
  id: number,
  payload: {
    driver_id?: number | null;
    contractor_id?: number | null;
    task_name?: string;
    sender?: string;
    receiver?: string;
    total_planned_volume?: number | null;
    material?: string;
    quantity?: number | null;
    unit?: string;
    notes?: string;
    driver_rate?: number | null;
    company_rate?: number | null;
    distance_km?: number | null;
    is_active?: boolean;
    description?: string;
    load_address?: string;
    unload_address?: string;
    amount?: number | null;
  }
): Promise<Order> {
  const { data } = await api.put<Order>(`/orders/${id}`, payload);
  return data;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await api.put<Order>(`/orders/${id}/status`, { status });
  return data;
}

export async function uploadOrderPhoto(id: number, fileUri: string): Promise<OrderPhoto> {
  const formData = new FormData();
  formData.append('photo', {
    uri: fileUri,
    name: `order_${id}_${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  const { data } = await api.post<OrderPhoto>(`/orders/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}
