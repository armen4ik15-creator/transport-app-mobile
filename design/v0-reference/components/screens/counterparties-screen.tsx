"use client"

import { useState } from "react"
import { Plus, Phone, ArrowRight, Building2 } from "lucide-react"
import {
  Card,
  Pill,
  Segmented,
  Fab,
  ScreenHeader,
  Progress,
} from "@/components/ui-kit"
import {
  COUNTERPARTIES,
  cpBalance,
  paymentStatus,
  formatRub,
  type Counterparty,
  type CounterpartyKind,
} from "@/lib/data"

type Filter = "all" | CounterpartyKind

export function CounterpartiesScreen({
  onAdd,
  onOpenPayments,
}: {
  onAdd: () => void
  onOpenPayments: (c: Counterparty) => void
}) {
  const [filter, setFilter] = useState<Filter>("all")

  const list = COUNTERPARTIES.filter((c) =>
    filter === "all" ? true : c.kind === filter,
  )

  const delivered = list.reduce((s, c) => s + c.delivered, 0)
  const paid = list.reduce((s, c) => s + c.paid, 0)
  const balance = delivered - paid

  return (
    <div className="relative flex h-full flex-col">
      <ScreenHeader
        title="Контрагенты"
        subtitle="Заказчики и поставщики"
        icon={Building2}
      />

      <div className="flex flex-col gap-3 px-4 pb-3 pt-3">
        <Segmented
          options={[
            { id: "all", label: "Все" },
            { id: "customer", label: "Заказчики" },
            { id: "supplier", label: "Поставщики" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="grid grid-cols-3 gap-2">
          <SummaryStat label="Навезли" value={formatRub(delivered)} tone="text-foreground" />
          <SummaryStat label="Оплатили" value={formatRub(paid)} tone="text-positive" />
          <SummaryStat
            label="Остаток"
            value={formatRub(balance)}
            tone={balance > 0 ? "text-chart-4" : "text-positive"}
          />
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col gap-2.5">
          {list.map((c) => {
            const bal = cpBalance(c)
            const status = paymentStatus(c)
            const ratio = c.delivered > 0 ? c.paid / c.delivered : 1
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">ИНН {c.inn}</p>
                  </div>
                  <Pill tone={c.kind === "customer" ? "info" : "neutral"}>
                    {c.kind === "customer" ? "Заказчик" : "Поставщик"}
                  </Pill>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Навезли</span>
                  <span className="text-right font-semibold tabular">
                    {formatRub(c.delivered)}
                  </span>
                  <span className="text-muted-foreground">Оплатили</span>
                  <span className="text-right font-semibold tabular text-positive">
                    {formatRub(c.paid)}
                  </span>
                  <span className="text-muted-foreground">
                    {c.kind === "customer" ? "Должны нам" : "Должны мы"}
                  </span>
                  <span
                    className={`text-right font-semibold tabular ${
                      bal > 0 ? "text-chart-4" : "text-positive"
                    }`}
                  >
                    {formatRub(Math.max(0, bal))}
                  </span>
                </div>

                <div className="mt-3">
                  <Progress
                    value={ratio}
                    tone={
                      status === "paid"
                        ? "positive"
                        : status === "partial"
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <Phone className="size-3.5" /> {c.phone}
                    </a>
                  )}
                  <button
                    onClick={() => onOpenPayments(c)}
                    className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    Оплаты и долг <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Fab onClick={onAdd} icon={Plus} />
    </div>
  )
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-xl bg-card p-2.5 text-center ring-1 ring-border/60">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xs font-bold tabular ${tone}`}>{value}</p>
    </div>
  )
}
