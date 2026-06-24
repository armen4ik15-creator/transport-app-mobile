"use client"

import type { Transaction } from "@/lib/types"
import {
  APPROVAL_META,
  CATEGORY_META,
  PAY_META,
  STATUS_META,
  formatDateShort,
  formatRub,
} from "@/lib/format"
import { Badge, CategoryIcon } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import { Check, Trash2, Wallet, X, Zap } from "lucide-react"

export function TransactionCard({
  tx,
  showDriver,
  onPay,
  onDelete,
  onApprove,
  onReject,
}: {
  tx: Transaction
  showDriver?: boolean
  onPay?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  onApprove?: (tx: Transaction) => void
  onReject?: (tx: Transaction) => void
}) {
  const meta = CATEGORY_META[tx.category]
  const pay = PAY_META[tx.payStatus]
  const status = STATUS_META[tx.status]
  const isImport = tx.source === "opti"
  const payable = tx.category !== "fuel" || onDelete // admin can attach payment to anything
  const approval = tx.approval ? APPROVAL_META[tx.approval] : null
  const showApproveActions = !!(onApprove && onReject && tx.approval === "pending")

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <CategoryIcon category={tx.category} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {tx.category === "fuel" && tx.station ? tx.station : meta.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatDateShort(tx.date)}
                {tx.category === "fuel" && tx.liters
                  ? ` • ${tx.liters} л`
                  : tx.comment
                    ? ` • ${tx.comment}`
                    : ""}
              </p>
            </div>
            <p
              className={cn(
                "shrink-0 text-sm font-semibold tabular",
                tx.category === "salary" ? "text-[#fbbf24]" : "text-foreground",
              )}
            >
              {formatRub(tx.amount)}
            </p>
          </div>

          {showDriver ? (
            <p className="mt-1.5 text-xs text-muted-foreground tabular">
              {tx.driverName} • {tx.carPlate}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {approval ? (
              <Badge className={approval.cls}>{approval.label}</Badge>
            ) : (
              <Badge className={status.cls}>{status.label}</Badge>
            )}
            <Badge className="border-border bg-secondary text-muted-foreground">
              {isImport ? (
                <>
                  <Zap size={11} /> Авто-импорт Opti
                </>
              ) : tx.source === "admin" ? (
                "Создано админом"
              ) : (
                "Создано водителем"
              )}
            </Badge>
            <span className={cn("ml-auto text-[11px] font-medium", pay.cls)}>
              {pay.label}
            </span>
          </div>

          {tx.approval === "rejected" && tx.rejectReason ? (
            <p className="mt-2 rounded-lg bg-[#ef4444]/10 px-2.5 py-1.5 text-[11px] text-[#f87171]">
              Причина: {tx.rejectReason}
            </p>
          ) : null}

          {tx.payments.length > 0 ? (
            <div className="mt-2 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              Платежей: {tx.payments.length} •{" "}
              {formatRub(tx.payments.reduce((s, p) => s + p.amount, 0))} из{" "}
              {formatRub(tx.amount)}
            </div>
          ) : null}

          {showApproveActions ? (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => onApprove!(tx)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#10b981]/30 bg-[#10b981]/15 px-3 py-2 text-xs font-medium text-[#34d399] active:bg-[#10b981]/25"
              >
                <Check size={14} />
                Одобрить
              </button>
              <button
                onClick={() => onReject!(tx)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/15 px-3 py-2 text-xs font-medium text-[#f87171] active:bg-[#ef4444]/25"
              >
                <X size={14} />
                Отклонить
              </button>
            </div>
          ) : null}

          {(onPay && payable) || onDelete ? (
            <div className="mt-2.5 flex items-center gap-2">
              {onPay && payable ? (
                <button
                  onClick={() => onPay(tx)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground active:bg-secondary/70"
                >
                  <Wallet size={14} />
                  {tx.category === "dps" ? "Оплатить штраф" : "Прикрепить платёж"}
                </button>
              ) : null}
              {onDelete ? (
                <button
                  onClick={() => onDelete(tx)}
                  aria-label="Удалить"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-[#f87171] active:bg-secondary/70"
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
