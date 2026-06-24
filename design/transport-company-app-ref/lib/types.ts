export type Role = "driver" | "admin" | "owner"

export type Category = "fuel" | "dps" | "repair" | "wash" | "salary" | "other"

export type TxSource = "driver" | "opti" | "admin"

export type TxStatus = "imported" | "matched" | "duplicate" | "manual"

export type PayStatus = "paid" | "unpaid" | "partial"

/** Approval state for driver-submitted expenses (pending/approved/rejected). */
export type Approval = "pending" | "approved" | "rejected"

export interface ContractorPayment {
  id: string
  contractor: string
  amount: number
  date: string // ISO
  comment?: string
}

export interface Transaction {
  id: string
  category: Category
  amount: number
  date: string // ISO
  comment?: string
  driverId: string
  driverName: string
  carPlate: string
  source: TxSource
  status: TxStatus
  payStatus: PayStatus
  /** Only meaningful for compensable driver expenses. undefined = not applicable. */
  approval?: Approval
  rejectReason?: string
  station?: string // for fuel
  liters?: number // for fuel
  hasReceipt?: boolean
  payments: ContractorPayment[]
}

export interface Driver {
  id: string
  name: string
  plate: string
  carModel: string
  phone: string
  fuelCard: string
  salary: number
  roles: Role[]
}

export type OrderStatus = "new" | "in_progress" | "done" | "cancelled"

export type Material = "Песок" | "Щебень" | "ПГС" | "Грунт" | "Отсев"

export type TripStage = "assigned" | "loading" | "unloading" | "done"

export interface Trip {
  id: string
  orderId: string
  driverId: string
  driverName: string
  plate: string
  stage: TripStage
  volume: number // m³
  ttnNumber?: string
  hasTtnPhoto?: boolean
  loadedAt?: string
  unloadedAt?: string
}

export interface Order {
  id: string
  number: string
  contractorId: string
  contractor: string
  material: Material
  volume: number // m³ total
  fromAddress: string
  toAddress: string
  driverRate: number // ₽ per m³ paid to driver
  companyRate: number // ₽ per m³ charged to contractor
  driverId?: string
  driverName?: string
  status: OrderStatus
  date: string // ISO
}

export interface Contractor {
  id: string
  name: string
  inn: string
  phone: string
  debt: number // ₽ owed by contractor to company
}

export type RequestKind = "driver" | "founder"

export interface RegistrationRequest {
  id: string
  kind: RequestKind
  name: string
  phone: string
  detail: string // plate for driver, company for founder
  date: string // ISO
  status: "pending" | "approved" | "rejected"
}

export type SalaryKind = "accrual" | "payment" | "debt"

export interface SalaryEntry {
  id: string
  driverId: string
  driverName: string
  kind: SalaryKind
  amount: number
  date: string // ISO
  comment?: string
}
