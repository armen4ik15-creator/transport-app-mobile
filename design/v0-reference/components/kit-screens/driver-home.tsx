"use client"

import { Package, Wallet, Bell, Truck, MapPin, FileText, ClipboardList, Check } from "lucide-react"
import { AppHeader, StatCard, SectionLabel, rub } from "@/components/kit"

const STEPS = [
  { key: "load", label: "Погрузка", icon: Package },
  { key: "unload", label: "Разгрузка", icon: MapPin },
  { key: "ttn", label: "ТТН", icon: FileText },
]

export function DriverHomeScreen({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const currentStep = 0 // 0-based: at "Погрузка"

  return (
    <div className="space-y-5 px-4 pb-28">
      <AppHeader title="Арам" subtitle="Водитель · Т111ОК" initials="АР" notifications={0} />

      {/* Current task */}
      <SectionLabel>Ваша задача сейчас</SectionLabel>
      <section className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <p className="font-bold text-foreground">Рейс по заказу #21</p>
        </div>
        <p className="mt-1 text-sm text-muted">Шаг 1 из 3: отметьте прибытие на погрузку</p>

        {/* Stepper */}
        <ol className="mt-4 flex items-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < currentStep
            const active = i === currentStep
            return (
              <li key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full border-2 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : done
                          ? "border-profit bg-profit text-white"
                          : "border-border bg-surface text-muted"
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className={`text-[11px] ${active ? "text-primary" : "text-muted"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 ? (
                  <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${i < currentStep ? "bg-profit" : "bg-border"}`} />
                ) : null}
              </li>
            )
          })}
        </ol>

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground active:scale-[0.99] transition-transform">
          <Package className="h-5 w-5" />
          НАЧАТЬ ПОГРУЗКУ
        </button>
        <button className="mt-2 flex w-full items-center justify-center gap-2 py-1 text-sm font-medium text-primary">
          <ClipboardList className="h-4 w-4" />
          История рейсов (0)
        </button>
      </section>

      <button onClick={() => onNavigate?.("orders")} className="w-full text-center text-sm font-medium text-primary">
        Подробнее о заказе
      </button>

      {/* KPIs */}
      <SectionLabel>Сегодня</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Package} iconColor="text-primary" label="Активные заказы" value="8" valueColor="text-primary" onClick={() => onNavigate?.("orders")} />
        <StatCard icon={Wallet} iconColor="text-profit" label="Заработок" value={rub(11500)} valueColor="text-profit" />
        <StatCard icon={Bell} iconColor="text-violet" label="Уведомления" value="0" valueColor="text-foreground" />
      </div>

      {/* Quick actions */}
      <SectionLabel>Разделы</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: "Мои заказы", color: "text-primary", to: "orders" },
          { icon: Wallet, label: "Мои финансы", color: "text-profit" },
          { icon: Bell, label: "Уведомления", color: "text-violet" },
        ].map((q) => {
          const Icon = q.icon
          return (
            <button
              key={q.label}
              onClick={() => q.to && onNavigate?.(q.to)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-surface-2 ${q.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center text-[11px] leading-tight text-muted">{q.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
