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
  task_name: string | null;
  sender: string | null;
  receiver: string | null;
  total_planned_volume: number | null;
  material: string | null;
  quantity: number | null;
  unit: string | null;
  status: OrderStatus;
  notes: string | null;
  created_by: number | null;
  description: string | null;
  load_address: string | null;
  unload_address: string | null;
  amount: number | null;
  driver_rate: number | null;
  company_rate: number | null;
  distance_km: number | null;
  is_active: number;
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

export type TtnPhotoSource = 'order' | 'trip';

export interface TtnPhotoRecord {
  id: number;
  order_id: number;
  file_path: string;
  uploaded_by: number | null;
  uploaded_at: string;
  driver_name: string | null;
  order_date: string | null;
  contractor_name: string | null;
  material: string | null;
  driver_id: number | null;
  source: TtnPhotoSource;
}

export interface OrderWithPhotos extends Order {
  photos: OrderPhoto[];
  trips: TripRecord[];
}

export type TripStage = 'loading' | 'unloading';

export type TripStatus = 'loading' | 'completed';

export interface TripRecord {
  id: number;
  order_id: number;
  driver_id: number;
  driver_name?: string | null;
  driver_car_number?: string | null;
  stage: TripStage;
  status?: TripStatus | null;
  ttn_number: string | null;
  volume: number | null;
  note: string | null;
  photo_path: string | null;
  created_by: number;
  created_by_email: string;
  created_at: string;
  completed_at?: string | null;
  task_name?: string | null;
  material?: string | null;
  load_address?: string | null;
  unload_address?: string | null;
  driver_rate?: number | null;
  company_rate?: number | null;
  distance_km?: number | null;
  unit?: string | null;
  quantity?: number | null;
  contractor_name?: string | null;
}

export interface EarningsSummary {
  total_trips: number;
  total_volume: number;
  estimated_income: number;
  actual_income: number;
  actual_expense: number;
  actual_balance: number;
}

export type DriverPaymentType = 'salary' | 'advance' | 'bonus' | 'deduction';

export type DriverPaymentMethod = 'cash' | 'noncash';

export interface DriverPaymentRecord {
  id: number;
  driver_id: number;
  type: DriverPaymentType;
  amount: number;
  method: DriverPaymentMethod | null;
  note: string | null;
  period_start: string | null;
  period_end: string | null;
  created_by: number | null;
  created_at: string;
  driver_name: string;
  driver_car_number: string | null;
}

export interface DriverAccruedPreview {
  driver_id: number;
  from: string;
  to: string;
  accrued: number;
  deductions: number;
  net: number;
}

export interface DriverSalarySummary {
  driver_id: number;
  gross: number;
  paid: number;
  deducted: number;
  debt: number;
}

export interface DriverDebtSummary extends DriverSalarySummary {
  driver_name: string | null;
  driver_car_number: string | null;
}

export interface ContractorPaymentRecord {
  id: number;
  contractor_id: number;
  amount: number;
  note: string | null;
  created_by: number | null;
  created_at: string;
  contractor_name: string;
}

export interface ContractorDebtSummary {
  contractor_id: number;
  contractor_name: string;
  accrued: number;
  paid: number;
  debt: number;
}

export type ExpenseMethod = 'cash' | 'noncash' | null;

export interface ExpenseRecord {
  id: number;
  exp_date: string;
  exp_type: string;
  method: ExpenseMethod;
  amount: number;
  comment: string | null;
  driver_id: number | null;
  car_number: string | null;
  created_by: number | null;
  created_at: string;
  driver_name: string | null;
}

export interface Material {
  id: number;
  name: string;
  unit: string;
  price_per_ton: number | null;
  created_by: number | null;
  created_at: string;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  model: string | null;
  capacity: number | null;
  created_by: number | null;
  created_at: string;
}

export interface Waybill {
  id: number;
  order_id: number;
  number: string;
  date: string;
  file_path: string | null;
  created_by: number | null;
  created_at: string;
  driver_id: number;
  contractor_name: string | null;
}

export interface Invoice {
  id: number;
  order_id: number;
  number: string;
  date: string;
  amount: number | null;
  file_path: string | null;
  created_by: number | null;
  created_at: string;
  driver_id: number;
  contractor_name: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  message: string;
  read: number;
  created_at: string;
  user_email?: string | null;
}

export interface ActivityLogItem {
  id: number;
  user_id: number | null;
  action: string;
  details: string | null;
  created_at: string;
  user_email?: string | null;
}

export const TRIP_STAGE_LABEL: Record<TripStage, string> = {
  loading: 'Погрузка',
  unloading: 'Разгрузка',
};

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  loading: 'В пути (погрузка)',
  completed: 'Завершён',
};

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

export interface OrderTemplate {
  id: number;
  name: string;
  contractor_id: number | null;
  contractor_name: string | null;
  material: string | null;
  unit: string | null;
  default_quantity: number | null;
  driver_rate: number | null;
  company_rate: number | null;
  distance_km: number | null;
  notes: string | null;
  description: string | null;
  load_address: string | null;
  unload_address: string | null;
  created_by: number | null;
  created_at: string;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Новый',
  in_progress: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
};
