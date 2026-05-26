export type Role = 'admin' | 'driver';

export interface User {
  id: number;
  email: string;
  role: Role;
  full_name?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface Driver {
  id: number;
  user_id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  license_number: string | null;
  license_expiry: string | null;
  medical_check_expiry: string | null;
  is_active: number;
  car_number: string | null;
  created_at: string;
}

export interface Contractor {
  id: number;
  name: string;
  type: string;
  phone: string | null;
  address: string | null;
  created_by: number | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  driver_id: number | null;
  contractor_id: number | null;
  material: string | null;
  quantity: number | null;
  status: OrderStatus;
  notes: string | null;
  created_by: number | null;
  description: string | null;
  load_address: string | null;
  unload_address: string | null;
  amount: number | null;
  created_at: string;
  updated_at: string;
  contractor_name: string | null;
  driver_name: string | null;
  driver_car_number: string | null;
}

export interface OrderPhoto {
  id: number;
  order_id: number;
  file_path: string;
  uploaded_at: string;
}

export interface OrderWithPhotos extends Order {
  photos: OrderPhoto[];
}

export type FinanceType = 'income' | 'expense';

export interface FinanceRecord {
  id: number;
  driver_id: number;
  type: FinanceType;
  amount: number;
  description: string | null;
  order_id: number | null;
  created_at: string;
  driver_name: string;
  driver_car_number: string | null;
}

export interface DriverBalance {
  driver_id: number;
  income: number;
  expense: number;
  balance: number;
}

export type DocumentType = 'waybill' | 'invoice' | 'act';

export interface DocumentRecord {
  id: number;
  order_id: number;
  type: DocumentType;
  file_path: string;
  created_by: number;
  created_at: string;
  driver_id: number;
  created_by_email: string;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  type: DocumentType;
  content: string;
  created_at: string;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Новый',
  in_progress: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
};
