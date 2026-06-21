"use client"

import { useState } from "react"
import {
  LogOut,
  MapPin,
  Truck,
  CheckCircle2,
  Wallet,
  Navigation,
  Clock,
} from "lucide-react"
import { Card, Pill, Button, Segmented, IconBadge } from "@/components/ui-kit"
import {
  ORDERS,
  TRIPS,
  driverById,
  counterpartyById,
  materialById,
  driverSalaryBalance,
  formatRub,
  formatDateTime,
  orderStatusLabel,
} from "@/lib/data"

type Tab = "tasks" | "trips" | "salary"

export function DriverModeScreen({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("tasks")
  // Demo: the logged-in driver is the first active one.
  const driver = driverById("d1")!
  const myOrders = ORDERS.filter((o) => o.driverId === driver.id && !o.archived)
  const myTrips = TRIPS.filter((t) => t.driverId === driver.id)
  const salary = driverSalaryBalance(driver.id)

  return (
    <div className="flex h-full flex-col">
      <header className="bg-primary px-4 pb-5 pt-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
              <Truck className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold">{driver.name}</h1>
              <p className="truncate text-xs text-primary-foreground/80">
                {driver.vehicle} · {driver.plate}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex size-9 items-center justify-center rounded-full bg-white/15"
            aria-label="Выйти"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Pill className="bg-white/20 text-primary-foreground">
            <Navigation className="size-3" /> На линии
          </Pill>
          <Pill className="bg-white/20 text-primary-foreground">
            {myOrders.length} активных заданий
          </Pill>
        </div>
      </header>

      <div className="px-4 pt-3">
        <Segmented
          options={[
            { id: "tasks", label: "Задания" },
            { id: "trips", label: "Мои рейсы" },
            { id: "salary", label: "Зарплата" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {tab === "tasks" && (
          <div className="flex flex-col gap-2.5">
            {myOrders.map((o) => {
              const cp = counterpartyById(o.customerId)
              const mat = materialById(o.materialId)
              return (
                <Card key={o.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{o.number}</span>
                    <Pill tone={o.status === "new" ? "info" : "warning"}>
                      {orderStatusLabel(o.status)}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cp?.name} · {mat?.name}, {o.volume} {mat?.unit}
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-border/60 pt-3 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-positive" />
                      <span className="truncate">{o.from}</span>
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-destructive" />
                      <span className="truncate">{o.to}</span>
                    </span>
                  </div>
                  <Button className="mt-3 w-full" variant="positive">
                    <CheckCircle2 className="size-4" /> Закрыть рейс (ТТН)
                  </Button>
                </Card>
              )
            })}
          </div>
        )}

        {tab === "trips" && (
          <div className="flex flex-col gap-2.5">
            {myTrips.map((t) => {
              const mat = materialById(t.materialId)
              return (
                <Card key={t.id} className="flex items-center gap-3">
                  <IconBadge icon={Clock} tone="info" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.ttn}</p>
                    <p className="text-xs text-muted-foreground">
                      {mat?.name}, {t.volume} {mat?.unit} · {formatDateTime(t.date)}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {tab === "salary" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <StatBox label="Начислено" value={formatRub(salary.accrued)} tone="text-foreground" />
              <StatBox label="Выплачено" value={formatRub(salary.paid)} tone="text-positive" />
            </div>
            <Card className="flex items-center gap-3">
              <IconBadge icon={Wallet} tone={salary.debt > 0 ? "warning" : "positive"} />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">К выплате</p>
                <p className="text-lg font-bold tabular">{formatRub(salary.debt)}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular ${tone}`}>{value}</p>
    </div>
  )
}
