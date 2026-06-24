"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { applyFilters } from "@/lib/filter"
import { formatRub } from "@/lib/format"
import {
  EMPTY_FILTERS,
  TransactionFilter,
  type Filters,
} from "@/components/transaction-filter"
import { Refreshable } from "@/components/ui/refreshable"
import { TransactionCard } from "@/components/transaction-card"
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives"
import { PaymentSheet } from "@/components/payment-sheet"
import type { Transaction } from "@/lib/types"
import { SearchX } from "lucide-react"

export function DriverTransactions() {
  const { transactions, toast } = useApp()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [loading, setLoading] = useState(true)
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
  const filtered = useMemo(() => applyFilters(mine, filters), [mine, filters])
  const total = filtered.reduce((s, t) => s + t.amount, 0)

  const openPay = (tx: Transaction) => {
    setPayTx(tx)
    setPaySheet(true)
  }

  return (
    <>
      <div className="shrink-0 px-4 pt-4">
        <TransactionFilter filters={filters} onChange={setFilters} />
      </div>

      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 800))
          setLoading(false)
          toast("Данные обновлены", "info")
        }}
        className="px-4 pb-6 pt-3"
      >
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Операций: <span className="text-foreground tabular">{filtered.length}</span>
          </span>
          <span className="text-muted-foreground">
            Сумма:{" "}
            <span className="font-medium text-foreground tabular">
              {formatRub(total)}
            </span>
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<SearchX size={26} />}
              title="Ничего не найдено"
              description="Измените параметры фильтра или сбросьте их."
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
