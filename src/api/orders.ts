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
  material?: string;
  quantity?: number | null;
  notes?: string;
  description?: string;
  load_address?: string;
  unload_address?: string;
  amount?: number | null;
}): Promise<Order> {
  const { data } = await api.post<Order>('/orders', payload);
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
