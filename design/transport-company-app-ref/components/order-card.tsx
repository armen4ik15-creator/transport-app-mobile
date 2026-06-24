"use client"

import type { Order } from "@/lib/types"
import { ORDER_STATUS_META, formatDateShort, formatNumber, formatRub } from "@/lib/format"
import { Badge } from "@/components/ui/primitives"
import { ArrowRight, MapPin, Package, ChevronRight, User } from "lucide-react"

export function OrderCard({
  order,
  onClick,
  hideDriver,
}: {
  order: Order
  onClick?: (o: Order) => void
  /** Driver context: hide the assigned-driver row and company margin. */
  hideDriver?: boolean
}) {
  const status = ORDER_STATUS_META[order.status]
  const margin = (order.companyRate - order.driverRate) * order.volume

  return (
    <button
      onClick={() => onClick?.(order)}
      className="w-full rounded-2xl border border-border bg-card p-3.5 text-left active:bg-card-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground tabular">
              {order.number}
            </span>
            <Badge className={status.cls}>{status.label}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {order.contractor}
          </p>
        </div>
        {onClick ? (
          <ChevronRight size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-sm text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-[#60a5fa]">
          <Package size={15} />
        </span>
        <span className="font-medium">{order.material}</span>
        <span className="text-muted-foreground">•</span>
        <span className="tabular text-muted-foreground">
          {formatNumber(order.volume)} м³
        </span>
      </div>

      <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin size={13} className="mt-0.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{order.fromAddress}</span>
        <ArrowRight size={12} className="mt-0.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{order.toAddress}</span>
      </div>

      {hideDriver ? (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
          <span>
            Ставка{" "}
            <span className="font-medium tabular text-foreground">
              {order.driverRate} ₽/м³
            </span>
          </span>
          <span className="tabular">{formatDateShort(order.date)}</span>
        </div>
      ) : (
        <>
          <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User size={13} />
              {order.driverName ?? "Не назначен"}
            </span>
            <span className="text-xs text-muted-foreground">
              Маржа{" "}
              <span className="font-medium tabular text-[#34d399]">
                {formatRub(margin)}
              </span>
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted-foreground tabular">
            {formatDateShort(order.date)}
          </p>
        </>
      )}
    </button>
  )
}
