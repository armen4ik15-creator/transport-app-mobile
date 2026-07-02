import type { VehicleDocumentType } from '../types';

export const VEHICLE_DOCUMENT_TYPES: VehicleDocumentType[] = [
  'sts',
  'contract',
  'pts',
  'insurance',
  'driver_passport',
];

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentType, string> = {
  sts: 'СТС',
  contract: 'Договор',
  pts: 'ПТС',
  insurance: 'Страховка',
  driver_passport: 'Паспорт водителя',
};

export const VEHICLE_DOCUMENT_ICONS: Record<VehicleDocumentType, string> = {
  sts: '🪪',
  contract: '📄',
  pts: '📘',
  insurance: '🛡',
  driver_passport: '🛂',
};
