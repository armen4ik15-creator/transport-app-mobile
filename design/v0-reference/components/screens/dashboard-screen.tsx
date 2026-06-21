"use client"

import {
  LogOut,
  Bell,
  ClipboardList,
  Users,
  Building2,
  ListChecks,
  Wallet,
  Plus,
  TrendingUp,
  Truck,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react"
import { Card, IconBadge, SectionTitle, Pill } from "@/components/ui-kit"
import {
  COMPANY,
  dashboardSummary,
  formatRub,
  ORDERS,
  counterpartyById,
  materialById,
  orderStatusLabel,
} from "@/lib/data"

export type QuickTarget =
  | "create-order"
  | "orders"
  | "drivers"
  | "counterparties"
  | "registry"
  | "finances"
  | "notifications"
  | "expenses"

export function DashboardScreen({
  onLogout,
  onQuick,
}: {
  onLogout: () => void
  onQuick: (t: QuickTarget) => void
}) {
  const s = dashboardSummary()
  const recent = ORDERS.filter((o) => !o.archived).slice(0, 3)

  const quick: { id: QuickTarget; label: string; icon: LucideIcon }[] = [
    { id: "create-order", label: "Новый заказ", icon: Plus },
    { id: "orders", label: "Заказы", icon: ClipboardList },
    { id: "drivers", label: "Водители", icon: Users },
    { id: "counterparties", label: "Контрагенты", icon: Building2 },
    { id: "registry", label: "Реестр", icon: ListChecks },
    { id: "finances", label: "Финансы", icon: Wallet },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "expenses", label: "Расходы", icon: CircleDollarSign },
  ]

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{COMPANY.role}</p>
          <h1 className="truncate text-lg font-bold">{COMPANY.user}</h1>
          <p className="truncate text-xs text-muted-foreground">{COMPANY.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground"
        >
          <LogOut className="size-3.5" /> Выйти
        </button>
      </header>

      {/* Summary */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Сводка</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <SummaryCard
            icon={ClipboardList}
            tone="info"
            label="Активные заказы"
            value={String(s.activeOrders)}
            onClick={() => onQuick("orders")}
          />
          <SummaryCard
            icon={Truck}
            tone="positive"
            label="Водители на линии"
            value={String(s.driversOnline)}
            onClick={() => onQuick("drivers")}
          />
          <SummaryCard
            icon={TrendingUp}
            tone="warning"
            label="Задолженность"
            value={formatRub(s.debt)}
            onClick={() => onQuick("counterparties")}
          />
          <SummaryCard
            icon={Bell}
            tone="danger"
            label="Уведомления"
            value={String(s.unread)}
            onClick={() => onQuick("notifications")}
          />
        </div>
      </section>

      {/* Quick access */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Быстрый доступ</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {quick.map((q) => {
            const Icon = q.icon
            return (
              <button
                key={q.id}
                onClick={() => onQuick(q.id)}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 ring-1 ring-border/60 transition active:scale-95"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
                  {q.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Recent orders */}
      <section className="flex flex-col gap-2">
        <SectionTitle
          action={
            <button
              onClick={() => onQuick("orders")}
              className="text-xs font-semibold text-primary"
            >
              Все →
            </button>
          }
        >
          Последние заказы
        </SectionTitle>
        <div className="flex flex-col gap-2.5">
          {recent.map((o) => {
            const cp = counterpartyById(o.customerId)
            const mat = materialById(o.materialId)
            return (
              <Card key={o.id} onClick={() => onQuick("orders")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{o.number}</span>
                  <Pill tone={o.status === "new" ? "info" : "warning"}>
                    {orderStatusLabel(o.status)}
                  </Pill>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {cp?.name} · {mat?.name}, {o.volume} {mat?.unit}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {o.from} → {o.to}
                </p>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  icon,
  tone,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon
  tone: "info" | "positive" | "warning" | "danger"
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border/60 transition active:scale-[0.98]"
    >
      <IconBadge icon={icon} tone={tone} />
      <span className="min-w-0">
        <span className="block text-base font-bold tabular leading-tight">
          {value}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {label}
        </span>
      </span>
    </button>
  )
}
