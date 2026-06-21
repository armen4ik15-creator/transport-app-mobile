"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, Truck } from "lucide-react"
import {
  Card,
  ChipRow,
  Select,
  Segmented,
  Button,
  Input,
  Field,
} from "@/components/ui-kit"
import { EmptyState } from "@/components/empty-state"
import {
  TRIPS,
  DRIVERS,
  driverById,
  materialById,
  formatDateTime,
  formatNum,
  PERIODS,
  inPeriod,
  type PeriodKey,
} from "@/lib/data"

type RegType = "general" | "by_vehicle"

export function RegistryScreen({ onExport }: { onExport: () => void }) {
  const [period, setPeriod] = useState<PeriodKey>("week")
  const [driver, setDriver] = useState("all")
  const [type, setType] = useState<RegType>("general")

  const trips = TRIPS.filter((t) => {
    if (!inPeriod(t.date, period)) return false
    if (driver !== "all" && t.driverId !== driver) return false
    return true
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const totalVolume = trips.reduce((s, t) => s + t.volume, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-1">
        <ChipRow options={PERIODS} value={period} onChange={setPeriod} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="С">
            <Input type="date" />
          </Field>
          <Field label="По">
            <Input type="date" />
          </Field>
        </div>
        <Select value={driver} onChange={(e) => setDriver(e.target.value)}>
          <option value="all">Все водители</option>
          {DRIVERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Segmented
          options={[
            { id: "general", label: "Общий" },
            { id: "by_vehicle", label: "По машине" },
          ]}
          value={type}
          onChange={setType}
        />
        <div className="flex items-center justify-between rounded-xl bg-card px-3.5 py-3 ring-1 ring-border/60">
          <span className="text-xs text-muted-foreground">
            Рейсов: <span className="font-semibold text-foreground">{trips.length}</span>
          </span>
          <span className="text-sm font-bold tabular">
            {formatNum(totalVolume)} ед.
          </span>
        </div>
        <Button onClick={onExport}>
          <FileSpreadsheet className="size-4" /> Скачать Excel
        </Button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {trips.length === 0 ? (
          <EmptyState
            title="Рейсов не найдено"
            description="Измените период или фильтры, чтобы увидеть рейсы реестра."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {trips.map((t) => {
              const drv = driverById(t.driverId)
              const mat = materialById(t.materialId)
              return (
                <Card key={t.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <FileText className="size-3.5" /> {t.ttn}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(t.date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {mat?.name} · {formatNum(t.volume)} {mat?.unit}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.from} → {t.to}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="size-3.5 text-primary" />
                    {drv?.name} · {drv?.plate}
                  </p>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
