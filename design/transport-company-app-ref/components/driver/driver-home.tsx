"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { isSameDay, formatRub } from "@/lib/format"
import { sumBy } from "@/lib/filter"
import { Refreshable } from "@/components/ui/refreshable"
import { TransactionCard } from "@/components/transaction-card"
import { Skeleton, Card, EmptyState } from "@/components/ui/primitives"
import { PaymentSheet } from "@/components/payment-sheet"
import type { Transaction } from "@/lib/types"
import { Fuel, ShieldAlert, Receipt, Wallet, Inbox } from "lucide-react"

export function DriverHome() {
  const { transactions, toast } = useApp()
  const [loading, setLoading] = useState(true)
  const [payTx, setPayTx] = useState<Transaction | null>(null)
  const [paySheet, setPaySheet] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  const today = new Date()
  const mine = transactions.filter((t) => t.driverId === CURRENT_DRIVER_ID)
  const todayTx = mine
    .filter((t) => isSameDay(t.date, today))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const fuel = sumBy(todayTx, (t) => t.category === "fuel")
  const fines = sumBy(todayTx, (t) => t.category === "dps")
  const other = sumBy(todayTx, (t) => !["fuel", "dps"].includes(t.category))
  const total = fuel + fines + other

  const recent = mine
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 8)

  const openPay = (tx: Transaction) => {
    setPayTx(tx)
    setPaySheet(true)
  }

  return (
    <>
      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 900))
          setLoading(false)
          toast("Данные обновлены", "info")
        }}
        className="px-4 pb-6 pt-4"
      >
        <p className="mb-3 text-sm text-muted-foreground">Сегодня</p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Fuel size={18} />}
              tint="text-[#60a5fa] bg-[#3b82f6]/15"
              label="Заправлено"
              value={formatRub(fuel)}
            />
            <StatCard
              icon={<ShieldAlert size={18} />}
              tint="text-[#f87171] bg-[#ef4444]/15"
              label="Штрафы"
              value={formatRub(fines)}
            />
            <StatCard
              icon={<Receipt size={18} />}
              tint="text-[#fbbf24] bg-[#f59e0b]/15"
              label="Прочие расходы"
              value={formatRub(other)}
            />
            <StatCard
              icon={<Wallet size={18} />}
              tint="text-[#34d399] bg-[#10b981]/15"
              label="Всего за день"
              value={formatRub(total)}
              highlight
            />
          </div>
        )}

        <div className="mb-3 mt-6 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Последние операции</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Inbox size={26} />}
              title="Нет расходов"
              description="Здесь появятся ваши заправки, штрафы и другие операции."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recent.map((tx) => (
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

function StatCard({
  icon,
  tint,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  tint: string
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        highlight ? "border-[#10b981]/30 bg-[#10b981]/10" : "border-border bg-card"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}
      >
        {icon}
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular text-foreground">{value}</p>
    </div>
  )
}
