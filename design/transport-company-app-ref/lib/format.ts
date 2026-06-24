import type { Category, TxStatus, PayStatus, Approval, OrderStatus } from "./types"

export function formatRub(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)
}

const MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
]

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export function formatDateInput(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}.${d.getFullYear()}`
}

export function isSameDay(a: string, b: Date): boolean {
  const d = new Date(a)
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  )
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; chart: string }
> = {
  fuel: { label: "Топливо", color: "var(--chart-1)", chart: "#3b82f6" },
  dps: { label: "ДПС / Штраф", color: "var(--chart-2)", chart: "#ef4444" },
  repair: { label: "Ремонт", color: "var(--chart-4)", chart: "#f59e0b" },
  wash: { label: "Мойка", color: "var(--chart-3)", chart: "#10b981" },
  salary: { label: "Зарплата", color: "var(--chart-5)", chart: "#8b94a8" },
  other: { label: "Прочее", color: "var(--muted-foreground)", chart: "#64748b" },
}

export const STATUS_META: Record<
  TxStatus,
  { label: string; cls: string }
> = {
  imported: {
    label: "Импортирована",
    cls: "bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30",
  },
  matched: {
    label: "Сопоставлена",
    cls: "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30",
  },
  duplicate: {
    label: "Дубликат",
    cls: "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30",
  },
  manual: {
    label: "Вручную",
    cls: "bg-muted-foreground/15 text-muted-foreground border-border",
  },
}

export const PAY_META: Record<PayStatus, { label: string; cls: string }> = {
  paid: { label: "Оплачено", cls: "text-[#34d399]" },
  partial: { label: "Частично", cls: "text-[#fbbf24]" },
  unpaid: { label: "Не оплачено", cls: "text-muted-foreground" },
}

/** Pill styles for driver-expense approval (pending/approved/rejected). */
export const APPROVAL_META: Record<Approval, { label: string; cls: string }> = {
  pending: {
    label: "На проверке",
    cls: "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30",
  },
  approved: {
    label: "Одобрено",
    cls: "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30",
  },
  rejected: {
    label: "Отклонено",
    cls: "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30",
  },
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; cls: string }
> = {
  new: {
    label: "Новый",
    cls: "bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30",
  },
  in_progress: {
    label: "В пути",
    cls: "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30",
  },
  done: {
    label: "Завершён",
    cls: "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30",
  },
  cancelled: {
    label: "Отменён",
    cls: "bg-muted-foreground/15 text-muted-foreground border-border",
  },
}

export const MATERIALS = ["Песок", "Щебень", "ПГС", "Грунт", "Отсев"] as const
