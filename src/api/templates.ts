import { api } from './client';
import type { DocumentTemplate } from '../types';

export async function listTemplates(): Promise<DocumentTemplate[]> {
  const { data } = await api.get<DocumentTemplate[]>('/templates');
  return data;
}

export async function createTemplate(payload: {
  name: string;
  type: 'waybill' | 'invoice' | 'act';
  content: string;
}): Promise<DocumentTemplate> {
  const { data } = await api.post<DocumentTemplate>('/templates', payload);
  return data;
}

export async function updateTemplate(
  id: number,
  payload: {
    name?: string;
    type?: 'waybill' | 'invoice' | 'act';
    content?: string;
  }
): Promise<DocumentTemplate> {
  const { data } = await api.put<DocumentTemplate>(`/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/templates/${id}`);
}
