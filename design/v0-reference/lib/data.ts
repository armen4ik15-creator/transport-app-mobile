// Domain types and mock data for ReestrPro — a logistics / dispatch management
// app for construction-materials hauling (inert materials: sand, gravel, etc.).
// No fuel cards, no Opti integration. Data is local mock data shaped so it can
// be swapped for a real API without structural changes.

/* ============================ Formatting ============================ */

export function formatRub(n: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : ""
  const abs = Math.abs(Math.round(n))
  return `${sign}${abs.toLocaleString("ru-RU")} ₽`
}

export function formatNum(n: number): string {
  return n.toLocaleString("ru-RU")
}

const today = new Date()
export function iso(daysAgo: number, h = 10, m = 0): string {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function isToday(isoStr: string): boolean {
  const d = new Date(isoStr)
  return d.toDateString() === new Date().toDateString()
}

export function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateShort(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  })
}

/* ============================ Drivers ============================ */

export type DriverStatus = "online" | "offline"

export interface Driver {
  id: string
  name: string
  phone: string
  vehicle: string
  plate: string
  status: DriverStatus
  active: boolean
  balance: number // owed to driver (salary debt), positive = company owes driver
}

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Иван Петров", phone: "+7 905 112-33-44", vehicle: "КамАЗ 6520", plate: "А123ВС 77", status: "online", active: true, balance: 18500 },
  { id: "d2", name: "Сергей Кузнецов", phone: "+7 916 224-55-66", vehicle: "МАЗ 6501", plate: "В456ОР 50", status: "online", active: true, balance: 0 },
  { id: "d3", name: "Алексей Смирнов", phone: "+7 903 778-90-12", vehicle: "Volvo FMX", plate: "Е789КХ 99", status: "offline", active: true, balance: 42000 },
  { id: "d4", name: "Дмитрий Орлов", phone: "+7 999 010-20-30", vehicle: "Scania P400", plate: "Н012МТ 33", status: "offline", active: true, balance: 5400 },
  { id: "d5", name: "Павел Воронов", phone: "+7 911 555-66-77", vehicle: "КамАЗ 65115", plate: "К345ЕМ 16", status: "offline", active: false, balance: 0 },
]

export function driverById(id?: string | null): Driver | undefined {
  return DRIVERS.find((d) => d.id === id)
}

export const VEHICLES = DRIVERS.map((d) => ({ id: d.id, label: `${d.vehicle} · ${d.plate}` }))

/* ============================ Materials ============================ */

export interface Material {
  id: string
  name: string
  unit: "м³" | "т"
}

export const MATERIALS: Material[] = [
  { id: "m1", name: "Песок строительный", unit: "м³" },
  { id: "m2", name: "Щебень 5–20", unit: "т" },
  { id: "m3", name: "ПГС", unit: "м³" },
  { id: "m4", name: "Грунт", unit: "м³" },
  { id: "m5", name: "Асфальтная крошка", unit: "т" },
]

export function materialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id)
}

/* ============================ Counterparties ============================ */

export type CounterpartyKind = "customer" | "supplier"

export interface Counterparty {
  id: string
  name: string
  inn: string
  kind: CounterpartyKind
  phone?: string
  delivered: number // navezli — сумма поставленного/отгруженного
  paid: number // оплачено
}

export const COUNTERPARTIES: Counterparty[] = [
  { id: "c1", name: 'ООО "СтройМонолит"', inn: "7701234567", kind: "customer", phone: "+7 495 100-10-10", delivered: 1240000, paid: 1120000 },
  { id: "c2", name: 'ИП Васильев А.А.', inn: "503812345678", kind: "customer", phone: "+7 926 200-20-20", delivered: 480000, paid: 480000 },
  { id: "c3", name: 'ООО "ДорСтрой 36"', inn: "3661122334", kind: "customer", phone: "+7 473 300-30-30", delivered: 920000, paid: 410000 },
  { id: "c4", name: 'Карьер "Северный"', inn: "5009876543", kind: "supplier", phone: "+7 800 555-35-35", delivered: 760000, paid: 600000 },
  { id: "c5", name: 'ООО "ИнертТорг"', inn: "7811555888", kind: "supplier", phone: "+7 812 400-40-40", delivered: 320000, paid: 320000 },
]

export function counterpartyById(id: string): Counterparty | undefined {
  return COUNTERPARTIES.find((c) => c.id === id)
}

export function cpBalance(c: Counterparty): number {
  // For customers: positive = they owe us. For suppliers: positive = we owe them.
  return c.delivered - c.paid
}

export function paymentStatus(c: Counterparty): "paid" | "partial" | "unpaid" {
  if (c.paid >= c.delivered) return "paid"
  if (c.paid <= 0) return "unpaid"
  return "partial"
}

/* ============================ Orders (Заказы) ============================ */

export type OrderStatus = "new" | "in_progress" | "delivered" | "archived"

export interface Order {
  id: string
  number: string
  customerId: string
  materialId: string
  volume: number
  from: string // загрузка
  to: string // выгрузка
  driverId: string | null
  price: number // стоимость заказа для клиента
  status: OrderStatus
  date: string
  archived: boolean
}

export const ORDERS: Order[] = [
  { id: "o1", number: "№1042", customerId: "c1", materialId: "m1", volume: 60, from: 'Карьер "Северный"', to: "ЖК Заречье, Москва", driverId: "d1", price: 84000, status: "in_progress", date: iso(0, 7, 30), archived: false },
  { id: "o2", number: "№1041", customerId: "c3", materialId: "m2", volume: 25, from: 'ООО "ИнертТорг"', to: "Объездная М4, Воронеж", driverId: "d2", price: 61500, status: "in_progress", date: iso(0, 8, 10), archived: false },
  { id: "o3", number: "№1040", customerId: "c2", materialId: "m3", volume: 40, from: 'Карьер "Северный"', to: "Коттеджный пос. Сосны", driverId: "d3", price: 52000, status: "new", date: iso(0, 9, 0), archived: false },
  { id: "o4", number: "№1039", customerId: "c1", materialId: "m4", volume: 30, from: "Стройплощадка Б-12", to: "Полигон ТКО", driverId: null, price: 27000, status: "new", date: iso(0, 10, 20), archived: false },
  { id: "o5", number: "№1038", customerId: "c3", materialId: "m2", volume: 25, from: 'ООО "ИнертТорг"', to: "Объездная М4, Воронеж", driverId: "d2", price: 61500, status: "delivered", date: iso(1, 14, 0), archived: true },
  { id: "o6", number: "№1037", customerId: "c2", materialId: "m1", volume: 50, from: 'Карьер "Северный"', to: "ЖК Заречье, Москва", driverId: "d1", price: 70000, status: "delivered", date: iso(2, 16, 30), archived: true },
]

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  delivered: "Доставлен",
  archived: "Архив",
}
export function orderStatusLabel(s: OrderStatus): string {
  return ORDER_STATUS_LABEL[s]
}

/* ============================ Trips registry (Реестр рейсов) ============================ */

export interface Trip {
  id: string
  date: string
  driverId: string
  materialId: string
  volume: number
  from: string
  to: string
  ttn: string // номер ТТН
  orderId: string
}

export const TRIPS: Trip[] = [
  { id: "t1", date: iso(0, 8, 45), driverId: "d1", materialId: "m1", volume: 12, from: 'Карьер "Северный"', to: "ЖК Заречье", ttn: "ТТН-50421", orderId: "o1" },
  { id: "t2", date: iso(0, 9, 30), driverId: "d1", materialId: "m1", volume: 12, from: 'Карьер "Северный"', to: "ЖК Заречье", ttn: "ТТН-50422", orderId: "o1" },
  { id: "t3", date: iso(0, 10, 5), driverId: "d2", materialId: "m2", volume: 25, from: 'ООО "ИнертТорг"', to: "Объездная М4", ttn: "ТТН-50423", orderId: "o2" },
  { id: "t4", date: iso(1, 11, 0), driverId: "d3", materialId: "m3", volume: 20, from: 'Карьер "Северный"', to: "Пос. Сосны", ttn: "ТТН-50410", orderId: "o3" },
  { id: "t5", date: iso(1, 12, 40), driverId: "d2", materialId: "m2", volume: 25, from: 'ООО "ИнертТорг"', to: "Объездная М4", ttn: "ТТН-50408", orderId: "o5" },
  { id: "t6", date: iso(2, 15, 10), driverId: "d1", materialId: "m1", volume: 50, from: 'Карьер "Северный"', to: "ЖК Заречье", ttn: "ТТН-50390", orderId: "o6" },
]

/* ============================ Expenses (Расходы) ============================ */

export type ExpenseCategory = "repair" | "salary" | "road" | "rent" | "tax" | "other"
export type PayMethod = "cash" | "card"

export interface Expense {
  id: string
  category: ExpenseCategory
  amount: number
  driverId: string | null
  date: string
  method: PayMethod
  note?: string
}

interface CatMeta {
  id: ExpenseCategory
  label: string
  icon: string
}
export const EXPENSE_CATEGORIES: CatMeta[] = [
  { id: "repair", label: "Ремонт и ТО", icon: "wrench" },
  { id: "salary", label: "Зарплата", icon: "banknote" },
  { id: "road", label: "Дорога / платники", icon: "route" },
  { id: "rent", label: "Аренда техники", icon: "truck" },
  { id: "tax", label: "Налоги / сборы", icon: "landmark" },
  { id: "other", label: "Прочее", icon: "ellipsis" },
]
export function expenseCategoryById(id: ExpenseCategory): CatMeta {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}

export const EXPENSES: Expense[] = [
  { id: "e1", category: "repair", amount: 34500, driverId: "d2", date: iso(0, 14, 0), method: "card", note: "Замена тормозных колодок" },
  { id: "e2", category: "road", amount: 2200, driverId: "d1", date: iso(0, 12, 0), method: "card", note: "Платная дорога М4" },
  { id: "e3", category: "salary", amount: 80000, driverId: "d3", date: iso(1, 18, 0), method: "cash", note: "Аванс за рейс" },
  { id: "e4", category: "rent", amount: 45000, driverId: null, date: iso(1, 10, 0), method: "card", note: "Аренда экскаватора" },
  { id: "e5", category: "tax", amount: 12800, driverId: null, date: iso(2, 9, 0), method: "card", note: "Транспортный налог" },
  { id: "e6", category: "repair", amount: 6700, driverId: "d1", date: iso(3, 16, 30), method: "cash", note: "Шиномонтаж" },
  { id: "e7", category: "other", amount: 1500, driverId: "d4", date: iso(4, 11, 0), method: "cash", note: "Мойка" },
]

/* ============================ Salaries (Зарплаты) ============================ */

export type SalaryKind = "payout" | "accrual"

export interface SalaryRecord {
  id: string
  driverId: string
  kind: SalaryKind
  amount: number
  date: string
  note?: string
}

export const SALARY_RECORDS: SalaryRecord[] = [
  { id: "s1", driverId: "d1", kind: "accrual", amount: 96000, date: iso(2), note: "Сдельно, 8 рейсов" },
  { id: "s2", driverId: "d1", kind: "payout", amount: 77500, date: iso(1), note: "Перевод на карту" },
  { id: "s3", driverId: "d3", kind: "accrual", amount: 84000, date: iso(2), note: "Сдельно, 7 рейсов" },
  { id: "s4", driverId: "d3", kind: "payout", amount: 42000, date: iso(0), note: "Аванс наличными" },
  { id: "s5", driverId: "d2", kind: "accrual", amount: 72000, date: iso(2) },
  { id: "s6", driverId: "d2", kind: "payout", amount: 72000, date: iso(0) },
  { id: "s7", driverId: "d4", kind: "accrual", amount: 30000, date: iso(2) },
  { id: "s8", driverId: "d4", kind: "payout", amount: 24600, date: iso(0) },
]

/* ============================ Notifications ============================ */

export type NotifyTone = "info" | "warning" | "positive"
export interface AppNotification {
  id: string
  title: string
  body: string
  date: string
  tone: NotifyTone
  read: boolean
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Новый заказ №1042", body: "ООО «СтройМонолит» — песок, 60 м³", date: iso(0, 7, 30), tone: "info", read: false },
  { id: "n2", title: "Долг по оплате", body: "ООО «ДорСтрой 36» — остаток 510 000 ₽", date: iso(0, 9, 5), tone: "warning", read: false },
  { id: "n3", title: "Рейс завершён", body: "Иван Петров закрыл ТТН-50422", date: iso(0, 9, 40), tone: "positive", read: false },
  { id: "n4", title: "Зарплата к выплате", body: "Алексею Смирнову начислено 42 000 ₽", date: iso(1, 18, 0), tone: "info", read: true },
]

/* ============================ Dashboard aggregates ============================ */

export const COMPANY = {
  name: "ООО «АвтоЛогистик»",
  user: "dispatcher@avtologistic.ru",
  role: "Диспетчер",
  server: "https://api.reestrpro.ru",
}

export function dashboardSummary() {
  const activeOrders = ORDERS.filter((o) => !o.archived).length
  const driversOnline = DRIVERS.filter((d) => d.status === "online").length
  const debt = COUNTERPARTIES.filter((c) => c.kind === "customer").reduce(
    (sum, c) => sum + Math.max(0, cpBalance(c)),
    0,
  )
  const unread = NOTIFICATIONS.filter((n) => !n.read).length
  return { activeOrders, driversOnline, debt, unread }
}

export function financeSummary() {
  const revenue = ORDERS.reduce((s, o) => s + o.price, 0)
  const expenses = EXPENSES.reduce((s, e) => s + e.amount, 0)
  const salary = SALARY_RECORDS.filter((s) => s.kind === "payout").reduce((s, r) => s + r.amount, 0)
  return { revenue, expenses, salary, profit: revenue - expenses - salary }
}

export function driverSalaryBalance(driverId: string) {
  const recs = SALARY_RECORDS.filter((s) => s.driverId === driverId)
  const accrued = recs.filter((r) => r.kind === "accrual").reduce((s, r) => s + r.amount, 0)
  const paid = recs.filter((r) => r.kind === "payout").reduce((s, r) => s + r.amount, 0)
  return { accrued, paid, debt: accrued - paid }
}

/* ============================ Period filters ============================ */

export type PeriodKey = "all" | "today" | "week" | "month"
export const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "all", label: "Всё" },
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
]

export function inPeriod(isoStr: string, period: PeriodKey): boolean {
  if (period === "all") return true
  const d = new Date(isoStr)
  const now = new Date()
  if (period === "today") return d.toDateString() === now.toDateString()
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (period === "week") return diff <= 7
  if (period === "month") return diff <= 31
  return true
}
