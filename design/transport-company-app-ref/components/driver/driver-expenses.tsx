"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { formatRub } from "@/lib/format"
import { Refreshable } from "@/components/ui/refreshable"
import { TransactionCard } from "@/components/transaction-card"
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives"
import { PaymentSheet } from "@/components/payment-sheet"
import type { Approval, Category, Transaction } from "@/lib/types"
import { Fuel, ShieldAlert, Wrench, Receipt, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"

// The four buckets a driver cares about, each summed from their transactions.
const BUCKETS: {
  key: string
  label: string
  icon: typeof Fuel
  tint: string
  match: (c: Category) => boolean
}[] = [
  { key: "fuel", label: "Топливо", icon: Fuel, tint: "text-[#60a5fa] bg-[#3b82f6]/15", match: (c) => c === "fuel" },
  { key: "dps", label: "Штрафы ДПС", icon: ShieldAlert, tint: "text-[#f87171] bg-[#ef4444]/15", match: (c) => c === "dps" },
  { key: "repair", label: "Ремонт / мойка", icon: Wrench, tint: "text-[#fbbf24] bg-[#f59e0b]/15", match: (c) => c === "repair" || c === "wash" },
  { key: "other", label: "Прочее", icon: Receipt, tint: "text-muted-foreground bg-muted-foreground/15", match: (c) => c === "other" || c === "salary" },
]

const STATUS_TABS: { id: "all" | Approval; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "pending", label: "На проверке" },
  { id: "approved", label: "Одобрено" },
  { id: "rejected", label: "Отклонено" },
]

export function DriverExpenses() {
  const { transactions, toast } = useApp()
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<"all" | Approval>("all")
  const [payTx, setPayTx] = useState<Transaction | null>(null)
  const [paySheet, setPaySheet] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const mine = useMemo(
    () =>
      transactions
        .filter((t) => t.driverId === CURRENT_DRIVER_ID)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [transactions],
  )

  const totals = useMemo(
    () =>
      BUCKETS.map((b) => ({
        ...b,
        value: mine.filter((t) => b.match(t.category)).reduce((s, t) => s + t.amount, 0),
      })),
    [mine],
  )

  const filtered = useMemo(() => {
    if (statusTab === "all") return mine
    return mine.filter((t) => t.approval === statusTab)
  }, [mine, statusTab])

  const pendingCount = mine.filter((t) => t.approval === "pending").length

  const openPay = (tx: Transaction) => {
    setPayTx(tx)
    setPaySheet(true)
  }

  return (
    <>
      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 800))
          setLoading(false)
          toast("Данные обновлены", "info")
        }}
        className="px-4 pb-6 pt-4"
      >
        {/* 4 category cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {totals.map((b) => {
              const Icon = b.icon
              return (
                <Card key={b.key} className="p-3.5">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", b.tint)}>
                    <Icon size={18} />
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground">{b.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular text-foreground">
                    {formatRub(b.value)}
                  </p>
                </Card>
              )
            })}
          </div>
        )}

        {/* status filter */}
        <div className="mt-5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusTab(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                statusTab === s.id
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
              )}
            >
              {s.label}
              {s.id === "pending" && pendingCount > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-bold text-[#1E1E1E]">
                  {pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <p className="mb-3 mt-4 text-sm font-medium text-foreground">Мои операции</p>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<SearchX size={26} />}
              title="Нет расходов"
              description="Здесь появятся ваши заправки, штрафы и другие операции."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((tx) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                onPay={tx.category === "dps" ? openPay : undefined}
              />
            ))}
          </div>
        )}
      </Refreshable>

      <PaymentSheet tx={payTx} open={paySheet} onClose={() => setPaySheet(false)} />
    </>
  )
}
