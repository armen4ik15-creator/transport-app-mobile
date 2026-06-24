"use client"

import { Package, Users, Wallet, Bell, RefreshCw, Plus, Building2, ArrowRight } from "lucide-react"
import {
  AppHeader,
  PnLCard,
  StatCard,
  DonutChart,
  ListRow,
  StatusPill,
  SectionLabel,
  rub,
  type DonutSlice,
} from "@/components/kit"

const EXPENSE_SLICES: DonutSlice[] = [
  { label: "Топливо", value: 84200, color: "#3b82f6" },
  { label: "Зарплаты", value: 52400, color: "#10b981" },
  { label: "Ремонт", value: 21349, color: "#f59e0b" },
  { label: "Налоги / ДПС", value: 9900, color: "#ef4444" },
  { label: "Прочее", value: 7000, color: "#8b5cf6" },
]

export function AdminHomeScreen({ onNavigate }: { onNavigate?: (key: string) => void }) {
  return (
    <div className="space-y-5 px-4 pb-28">
      <AppHeader
        title="Дашборд"
        subtitle="Aram Grigoryan · Администратор"
        initials="AG"
        notifications={0}
      />

      {/* Sync banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Синхронизация Opti</p>
          <p className="truncate text-sm text-muted">Топливные транзакции</p>
        </div>
        <StatusPill label="Активно" tone="active" />
      </div>

      {/* P&L */}
      <div className="flex gap-3">
        <PnLCard label="Сегодня" profit={0} revenue={0} expenses={0} trend={0} />
        <PnLCard label="За месяц" profit={28401} revenue={203250} expenses={174849} trend={12} />
      </div>

      {/* Expense donut */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Структура расходов</h2>
          <button onClick={() => onNavigate?.("expenses")} className="flex items-center gap-1 text-sm text-primary">
            Все <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <DonutChart data={EXPENSE_SLICES} />
      </section>

      {/* KPI grid */}
      <SectionLabel>Сводка</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Package} iconColor="text-primary" label="Активные заказы" value="13" valueColor="text-primary" onClick={() => onNavigate?.("orders")} />
        <StatCard icon={Users} iconColor="text-profit" label="Водителей на линии" value="2" valueColor="text-profit" />
        <StatCard icon={Wallet} iconColor="text-warning" label="Задолженность" value={rub(226400)} valueColor="text-warning" />
        <StatCard icon={Bell} iconColor="text-violet" label="Уведомления" value="0" valueColor="text-foreground" />
      </div>

      {/* Quick actions */}
      <SectionLabel>Быстрый доступ</SectionLabel>
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: "Новый\u00a0заказ", color: "text-primary" },
          { icon: Package, label: "Заказы", color: "text-primary", to: "orders" },
          { icon: Users, label: "Водители", color: "text-profit" },
          { icon: Building2, label: "Контраг.", color: "text-muted" },
        ].map((q) => {
          const Icon = q.icon
          return (
            <button
              key={q.label}
              onClick={() => q.to && onNavigate?.(q.to)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-surface-2 ${q.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center text-[11px] leading-tight text-muted">{q.label}</span>
            </button>
          )
        })}
      </div>

      {/* Recent orders */}
      <SectionLabel>Последние заказы</SectionLabel>
      <div className="space-y-2.5">
        <ListRow
          icon={Package}
          title="ГК СА · Песок карьерный"
          subtitle="#22 · Карьер Гришино → С. Беговая"
          trailing={<StatusPill label="Новый" tone="new" />}
          onClick={() => onNavigate?.("orders")}
        />
        <ListRow
          icon={Package}
          title="Неруд · ПГС"
          subtitle="#19 · Т111ОК · в работе"
          trailing={<StatusPill label="Активно" tone="active" />}
          onClick={() => onNavigate?.("orders")}
        />
      </div>
    </div>
  )
}
