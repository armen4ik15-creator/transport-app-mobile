import { api } from './client';
import type { VehicleDocument, VehicleDocumentType } from '../types';

export async function listVehicleDocuments(vehicleId?: number): Promise<VehicleDocument[]> {
  const { data } = await api.get<VehicleDocument[]>('/vehicle-documents', {
    params: vehicleId ? { vehicle_id: vehicleId } : undefined,
  });
  return data;
}

export async function uploadVehicleDocument(payload: {
  vehicle_id: number;
  doc_type: VehicleDocumentType;
  fileUri: string;
  mimeType?: string;
}): Promise<VehicleDocument> {
  const formData = new FormData();
  formData.append('vehicle_id', String(payload.vehicle_id));
  formData.append('doc_type', payload.doc_type);
  const isPdf = payload.mimeType === 'application/pdf' || payload.fileUri.toLowerCase().endsWith('.pdf');
  formData.append('file', {
    uri: payload.fileUri,
    name: `vehicle_${payload.doc_type}_${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`,
    type: isPdf ? 'application/pdf' : 'image/jpeg',
  } as unknown as Blob);

  const { data } = await api.post<VehicleDocument>('/vehicle-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

export async function deleteVehicleDocument(id: number): Promise<void> {
  await api.delete(`/vehicle-documents/${id}`);
}
