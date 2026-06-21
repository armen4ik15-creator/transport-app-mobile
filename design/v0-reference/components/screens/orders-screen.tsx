"use client"

import { useState } from "react"
import { Search, Plus, MapPin, User, Truck } from "lucide-react"
import {
  Card,
  Pill,
  Input,
  Segmented,
  Select,
  Fab,
  Button,
} from "@/components/ui-kit"
import { EmptyState } from "@/components/empty-state"
import {
  ORDERS,
  DRIVERS,
  counterpartyById,
  materialById,
  driverById,
  orderStatusLabel,
  formatRub,
  formatDateTime,
  type Order,
  type OrderStatus,
} from "@/lib/data"

type View = "active" | "archive"

function statusTone(s: OrderStatus): "info" | "warning" | "positive" | "neutral" {
  if (s === "new") return "info"
  if (s === "in_progress") return "warning"
  if (s === "delivered") return "positive"
  return "neutral"
}

export function OrdersScreen({ onCreate }: { onCreate: () => void }) {
  const [view, setView] = useState<View>("active")
  const [query, setQuery] = useState("")
  const [driver, setDriver] = useState<string>("all")

  const filtered = ORDERS.filter((o) => {
    if (view === "active" ? o.archived : !o.archived) return false
    if (driver !== "all" && o.driverId !== driver) return false
    if (query) {
      const cp = counterpartyById(o.customerId)?.name ?? ""
      const hay = `${o.number} ${cp} ${o.to} ${o.from}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-1">
        <Segmented
          options={[
            { id: "active", label: "Активные" },
            { id: "archive", label: "Архив" },
          ]}
          value={view}
          onChange={setView}
        />
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заказам"
            className="pl-10"
          />
        </div>
        <Select value={driver} onChange={(e) => setDriver(e.target.value)}>
          <option value="all">Все водители</option>
          {DRIVERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <EmptyState
            title="Заказов нет"
            description={
              view === "active"
                ? "Создайте первый заказ, нажав на кнопку ниже."
                : "В архиве пока пусто."
            }
            action={
              view === "active"
                ? { label: "Создать заказ", onClick: onCreate }
                : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} archive={view === "archive"} />
            ))}
          </div>
        )}
      </div>

      <Fab onClick={onCreate} icon={Plus} label="Создать" />
    </div>
  )
}

function OrderCard({ order, archive }: { order: Order; archive: boolean }) {
  const cp = counterpartyById(order.customerId)
  const mat = materialById(order.materialId)
  const drv = driverById(order.driverId)

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{order.number}</span>
            <Pill tone={statusTone(order.status)}>
              {orderStatusLabel(order.status)}
            </Pill>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {cp?.name}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular text-primary">
          {formatRub(order.price)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="rounded-md bg-secondary px-2 py-1 font-medium">
          {mat?.name}, {order.volume} {mat?.unit}
        </span>
        <span className="text-muted-foreground">{formatDateTime(order.date)}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-border/60 pt-3 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-positive" />
          <span className="truncate">{order.from}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-destructive" />
          <span className="truncate">{order.to}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {drv ? (
            <>
              <User className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">
                {drv.name} · {drv.vehicle}
              </span>
            </>
          ) : (
            <>
              <Truck className="size-3.5 shrink-0 text-chart-4" />
              <span className="text-chart-4">Водитель не назначен</span>
            </>
          )}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="h-10 min-h-10 flex-1 text-xs">
          {archive ? "Открыть" : "Изменить"}
        </Button>
        <Button
          variant={archive ? "secondary" : "ghost"}
          className="h-10 min-h-10 flex-1 text-xs"
        >
          {archive ? "Восстановить" : "В архив"}
        </Button>
      </div>
    </Card>
  )
}
