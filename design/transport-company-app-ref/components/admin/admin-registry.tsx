"use client"

import { useMemo, useState } from "react"
import type { TripStage } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { SubScreen } from "@/components/ui/sub-screen"
import { Card, EmptyState, Badge } from "@/components/ui/primitives"
import { formatDateShort, formatRub } from "@/lib/format"
import { ClipboardList, FileText, Camera } from "lucide-react"

const STAGE_META: Record<TripStage, { label: string; cls: string }> = {
  assigned: {
    label: "Назначен",
    cls: "bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30",
  },
  loading: {
    label: "Погрузка",
    cls: "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30",
  },
  unloading: {
    label: "Выгрузка",
    cls: "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30",
  },
  done: {
    label: "Завершён",
    cls: "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30",
  },
}

const FILTERS: { value: "all" | TripStage; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "loading", label: "В работе" },
  { value: "done", label: "Завершённые" },
]

export function AdminRegistry({ onBack }: { onBack: () => void }) {
  const { trips, orders } = useApp()
  const [filter, setFilter] = useState<"all" | TripStage>("all")

  const rows = useMemo(() => {
    return trips
      .map((t) => ({ trip: t, order: orders.find((o) => o.id === t.orderId) }))
      .filter(({ trip }) => {
        if (filter === "all") return true
        if (filter === "done") return trip.stage === "done"
        return trip.stage === "loading" || trip.stage === "unloading" || trip.stage === "assigned"
      })
  }, [trips, orders, filter])

  const totalVolume = rows.reduce((s, r) => s + r.trip.volume, 0)

  return (
    <SubScreen title="Реестр рейсов" subtitle={`Всего: ${rows.length} · ${totalVolume} м³`} onBack={onBack}>
      <div className="flex shrink-0 gap-2 px-4 pb-1 pt-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
              (filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground active:bg-secondary/70")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 no-scrollbar">
        {rows.length === 0 ? (
          <EmptyState icon={<ClipboardList size={26} />} title="Рейсов нет" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map(({ trip, order }) => {
              const m = STAGE_META[trip.stage]
              const revenue = order ? trip.volume * order.companyRate : 0
              return (
                <Card key={trip.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {order ? `${order.material} · ${order.number}` : "Рейс"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {trip.driverName} · {trip.plate}
                      </p>
                    </div>
                    <Badge className={m.cls}>{m.label}</Badge>
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-border pt-2.5 text-center">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Объём</p>
                      <p className="text-sm font-semibold tabular text-foreground">
                        {trip.volume} м³
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Выручка</p>
                      <p className="text-sm font-semibold tabular text-foreground">
                        {formatRub(revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Дата</p>
                      <p className="text-sm font-medium tabular text-foreground">
                        {trip.unloadedAt
                          ? formatDateShort(trip.unloadedAt)
                          : trip.loadedAt
                            ? formatDateShort(trip.loadedAt)
                            : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {trip.ttnNumber ? `ТТН ${trip.ttnNumber}` : "ТТН нет"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera size={12} />
                      {trip.hasTtnPhoto ? "Фото есть" : "Без фото"}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </SubScreen>
  )
}
