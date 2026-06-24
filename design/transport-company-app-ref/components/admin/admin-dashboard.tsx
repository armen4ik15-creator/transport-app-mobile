"use client"

import { useEffect, useMemo, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { useApp } from "@/components/app-provider"
import { REVENUE } from "@/lib/mock-data"
import {
  CATEGORY_META,
  formatRub,
  isSameDay,
} from "@/lib/format"
import { sumBy } from "@/lib/filter"
import { Refreshable } from "@/components/ui/refreshable"
import { Card, Skeleton } from "@/components/ui/primitives"
import { TransactionCard } from "@/components/transaction-card"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import type { Category, Transaction } from "@/lib/types"
import {
  ChevronRight,
  Fuel,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

export function AdminDashboard() {
  const { transactions, toast } = useApp()
  const [loading, setLoading] = useState(true)
  const [drill, setDrill] = useState<{
    title: string
    items: Transaction[]
  } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(t)
  }, [])

  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()

  const todayTx = transactions.filter((t) => isSameDay(t.date, today))
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const expToday = todayTx.reduce((s, t) => s + t.amount, 0)
  const expMonth = monthTx.reduce((s, t) => s + t.amount, 0)
  const profitToday = REVENUE.today - expToday
  const profitMonth = REVENUE.month - expMonth

  const byCategory = useMemo(() => {
    const map = new Map<Category, number>()
    monthTx.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount))
    return Array.from(map.entries())
      .map(([cat, value]) => ({
        cat,
        name: CATEGORY_META[cat].label,
        value,
        color: CATEGORY_META[cat].chart,
      }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx])

  const fuelToday = sumBy(todayTx, (t) => t.category === "fuel")
  const finesToday = sumBy(todayTx, (t) => t.category === "dps")
  const salaryDue = sumBy(
    transactions,
    (t) => t.category === "salary" && t.payStatus !== "paid",
  )

  const refresh = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    toast("Дашборд обновлён", "info")
  }

  const openDrill = (title: string, predicate: (t: Transaction) => boolean) => {
    setDrill({
      title,
      items: transactions
        .filter(predicate)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    })
  }

  return (
    <>
      <Refreshable onRefresh={refresh} className="px-4 pb-6 pt-4">
        {/* Opti sync banner */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-3">
          <RefreshCw size={18} className="shrink-0 text-[#60a5fa]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Синхронизация Opti</p>
            <p className="text-xs text-muted-foreground">
              Последняя синхронизация 2 мин назад
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#10b981]/20 px-2.5 py-1 text-xs font-semibold text-[#34d399]">
            +3 новых
          </span>
        </div>

        {loading ? (
          <Skeleton className="mb-4 h-40" />
        ) : (
          <PnLWidget
            expToday={expToday}
            expMonth={expMonth}
            profitToday={profitToday}
            profitMonth={profitMonth}
          />
        )}

        {/* Donut */}
        <p className="mb-2 mt-6 text-sm font-medium text-foreground">
          Расходы по категориям за месяц
        </p>
        {loading ? (
          <Skeleton className="h-56" />
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {byCategory.map((entry) => (
                        <Cell key={entry.cat} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Всего</span>
                  <span className="text-sm font-semibold tabular text-foreground">
                    {formatRub(expMonth)}
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {byCategory.map((c) => (
                  <button
                    key={c.cat}
                    onClick={() =>
                      openDrill(
                        `${c.name} за месяц`,
                        (t) =>
                          t.category === c.cat &&
                          new Date(t.date).getMonth() === month,
                      )
                    }
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {c.name}
                    </span>
                    <span className="text-xs font-medium tabular text-foreground">
                      {formatRub(c.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Quick cards */}
        <p className="mb-2 mt-6 text-sm font-medium text-foreground">Быстрый доступ</p>
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <QuickCard
              icon={<Fuel size={18} />}
              tint="text-[#60a5fa] bg-[#3b82f6]/15"
              label="Топливо сегодня"
              value={formatRub(fuelToday)}
              onClick={() =>
                openDrill(
                  "Топливо сегодня",
                  (t) => t.category === "fuel" && isSameDay(t.date, today),
                )
              }
            />
            <QuickCard
              icon={<ShieldAlert size={18} />}
              tint="text-[#f87171] bg-[#ef4444]/15"
              label="Штрафы сегодня"
              value={formatRub(finesToday)}
              onClick={() =>
                openDrill(
                  "Штрафы сегодня",
                  (t) => t.category === "dps" && isSameDay(t.date, today),
                )
              }
            />
            <QuickCard
              icon={<Wallet size={18} />}
              tint="text-[#fbbf24] bg-[#f59e0b]/15"
              label="Зарплата к выплате"
              value={formatRub(salaryDue)}
              onClick={() =>
                openDrill(
                  "Зарплата к выплате",
                  (t) => t.category === "salary" && t.payStatus !== "paid",
                )
              }
            />
          </div>
        )}
      </Refreshable>

      <BottomSheet
        open={!!drill}
        onClose={() => setDrill(null)}
        title={drill?.title}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          {drill?.items.length ? (
            drill.items.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} showDriver />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Нет данных за период.
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  )
}

function PnLWidget({
  expToday,
  expMonth,
  profitToday,
  profitMonth,
}: {
  expToday: number
  expMonth: number
  profitToday: number
  profitMonth: number
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-border">
        <PnLColumn
          period="Сегодня"
          income={REVENUE.today}
          expense={expToday}
          profit={profitToday}
          change={REVENUE.todayChange}
        />
        <PnLColumn
          period="За месяц"
          income={REVENUE.month}
          expense={expMonth}
          profit={profitMonth}
          change={REVENUE.monthChange}
        />
      </div>
    </Card>
  )
}

function PnLColumn({
  period,
  income,
  expense,
  profit,
  change,
}: {
  period: string
  income: number
  expense: number
  profit: number
  change: number
}) {
  const positive = profit >= 0
  const up = change >= 0
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{period}</p>
        <span
          className={`flex items-center gap-0.5 text-[11px] font-medium tabular ${
            up ? "text-[#34d399]" : "text-[#f87171]"
          }`}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}%
        </span>
      </div>
      <p
        className={`mt-2 text-xl font-bold tabular ${
          positive ? "text-[#34d399]" : "text-[#f87171]"
        }`}
      >
        {formatRub(profit)}
      </p>
      <p className="text-[11px] text-muted-foreground">Прибыль</p>
      <div className="mt-3 flex flex-col gap-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Доход</span>
          <span className="tabular text-foreground">{formatRub(income)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Расход</span>
          <span className="tabular text-[#f87171]">{formatRub(expense)}</span>
        </div>
      </div>
    </div>
  )
}

function QuickCard({
  icon,
  tint,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode
  tint: string
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left active:bg-card-elevated"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold tabular text-foreground">{value}</p>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  )
}
