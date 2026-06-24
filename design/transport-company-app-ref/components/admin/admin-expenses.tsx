"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { applyFilters } from "@/lib/filter"
import { formatRub } from "@/lib/format"
import {
  EMPTY_FILTERS,
  TransactionFilter,
  type Filters,
} from "@/components/transaction-filter"
import { Refreshable } from "@/components/ui/refreshable"
import { TransactionCard } from "@/components/transaction-card"
import { Card, EmptyState, Skeleton, Btn } from "@/components/ui/primitives"
import { PaymentSheet } from "@/components/payment-sheet"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { TextArea } from "@/components/ui/fields"
import { ExpenseForm } from "@/components/expense-form"
import type { Transaction } from "@/lib/types"
import { SearchX, Plus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusTab = "all" | "pending" | "approved" | "rejected"

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "pending", label: "На проверке" },
  { id: "approved", label: "Одобрено" },
  { id: "rejected", label: "Отклонено" },
]

export function AdminExpenses() {
  const { transactions, toast, deleteTransaction, setApproval } = useApp()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [loading, setLoading] = useState(true)
  const [payTx, setPayTx] = useState<Transaction | null>(null)
  const [paySheet, setPaySheet] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [rejectTx, setRejectTx] = useState<Transaction | null>(null)
  const [reason, setReason] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [transactions],
  )
  const byFilter = useMemo(() => applyFilters(sorted, filters), [sorted, filters])
  const filtered = useMemo(() => {
    if (statusTab === "all") return byFilter
    return byFilter.filter((t) => t.approval === statusTab)
  }, [byFilter, statusTab])

  const total = filtered.reduce((s, t) => s + t.amount, 0)
  const pendingCount = sorted.filter((t) => t.approval === "pending").length

  const openPay = (tx: Transaction) => {
    setPayTx(tx)
    setPaySheet(true)
  }

  const confirmReject = () => {
    if (!rejectTx) return
    setApproval(rejectTx.id, "rejected", reason.trim() || "Без указания причины")
    toast("Расход отклонён", "info")
    setRejectTx(null)
    setReason("")
  }

  return (
    <>
      <div className="shrink-0 px-4 pt-4">
        <TransactionFilter filters={filters} onChange={setFilters} showDriver />

        {/* status tabs */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
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
      </div>

      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 700))
          setLoading(false)
          toast("Данные обновлены", "info")
        }}
        className="px-4 pb-6 pt-3"
      >
        {pendingCount > 0 && statusTab === "all" ? (
          <button
            onClick={() => setStatusTab("pending")}
            className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-left"
          >
            <AlertCircle size={18} className="shrink-0 text-[#fbbf24]" />
            <span className="flex-1 text-sm text-foreground">
              {pendingCount} расход(ов) ожидают проверки
            </span>
          </button>
        ) : null}

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
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
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
                showDriver
                onPay={tx.payStatus !== "paid" ? openPay : undefined}
                onApprove={(t) => {
                  setApproval(t.id, "approved")
                  toast("Расход одобрен", "success")
                }}
                onReject={(t) => setRejectTx(t)}
                onDelete={(t) => {
                  deleteTransaction(t.id)
                  toast("Операция удалена", "info")
                }}
              />
            ))}
          </div>
        )}
      </Refreshable>

      <button
        onClick={() => setFormOpen(true)}
        aria-label="Добавить расход"
        className="absolute bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:bg-primary/85"
      >
        <Plus size={26} />
      </button>

      <ExpenseForm role="admin" open={formOpen} onClose={() => setFormOpen(false)} />
      <PaymentSheet tx={payTx} open={paySheet} onClose={() => setPaySheet(false)} />

      <BottomSheet
        open={!!rejectTx}
        onClose={() => {
          setRejectTx(null)
          setReason("")
        }}
        title="Отклонить расход"
      >
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-sm text-muted-foreground">
            Укажите причину отклонения — водитель увидит её в своих расходах.
          </p>
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: нет фото чека"
          />
          <Btn variant="danger" full onClick={confirmReject}>
            Отклонить расход
          </Btn>
        </div>
      </BottomSheet>
    </>
  )
}
