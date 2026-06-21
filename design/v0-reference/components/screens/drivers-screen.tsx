"use client"

import { useState } from "react"
import { Plus, Phone, Truck, Circle, Wallet } from "lucide-react"
import { Card, Pill, Segmented, Fab, ScreenHeader } from "@/components/ui-kit"
import {
  DRIVERS,
  driverSalaryBalance,
  formatRub,
  type Driver,
} from "@/lib/data"

type Filter = "all" | "online" | "inactive"

export function DriversScreen({
  onAdd,
  onOpenSalary,
}: {
  onAdd: () => void
  onOpenSalary: () => void
}) {
  const [filter, setFilter] = useState<Filter>("all")

  const list = DRIVERS.filter((d) => {
    if (filter === "online") return d.status === "online"
    if (filter === "inactive") return !d.active
    return true
  })

  return (
    <div className="relative flex h-full flex-col">
      <ScreenHeader title="Водители" subtitle="Автопарк и экипажи" icon={Truck} />

      <div className="px-4 pb-3 pt-3">
        <Segmented
          options={[
            { id: "all", label: "Все" },
            { id: "online", label: "На линии" },
            { id: "inactive", label: "Неактивные" },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col gap-2.5">
          {list.map((d) => (
            <DriverCard key={d.id} driver={d} onOpenSalary={onOpenSalary} />
          ))}
        </div>
      </div>

      <Fab onClick={onAdd} icon={Plus} />
    </div>
  )
}

function DriverCard({
  driver,
  onOpenSalary,
}: {
  driver: Driver
  onOpenSalary: () => void
}) {
  const sal = driverSalaryBalance(driver.id)
  const initials = driver.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {initials}
          <Circle
            className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ${
              driver.status === "online"
                ? "fill-positive text-positive"
                : "fill-muted-foreground text-muted-foreground"
            }`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{driver.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="size-3.5" /> {driver.vehicle} · {driver.plate}
          </p>
        </div>
        {!driver.active && <Pill tone="neutral">Неактивен</Pill>}
        {driver.active && driver.status === "online" && (
          <Pill tone="positive">На линии</Pill>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <a
          href={`tel:${driver.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Phone className="size-3.5" /> {driver.phone}
        </a>
        <button
          onClick={onOpenSalary}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <Wallet className="size-3.5 text-primary" />
          <span className={sal.debt > 0 ? "text-chart-4" : "text-positive"}>
            {sal.debt > 0 ? `Долг ${formatRub(sal.debt)}` : "Расчёт закрыт"}
          </span>
        </button>
      </div>
    </Card>
  )
}
