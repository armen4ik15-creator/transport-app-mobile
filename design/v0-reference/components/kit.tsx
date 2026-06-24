"use client"

import type { ReactNode } from "react"
import {
  Bell,
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
  Plus,
  type LucideIcon,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

/** Format an integer as RUB with thin-space grouping. Never truncated. */
export function rub(value: number) {
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(Math.round(value))
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")
  return `${sign}${grouped}\u202f₽`
}

/* ------------------------------------------------------------------ */
/*  AppHeader                                                          */
/* ------------------------------------------------------------------ */

export function AppHeader({
  title,
  subtitle,
  initials,
  showBell = true,
  notifications = 0,
}: {
  title: string
  subtitle?: string
  initials?: string
  showBell?: boolean
  notifications?: number
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight text-foreground text-balance">{title}</h1>
        {subtitle ? <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {showBell ? (
          <button
            aria-label="Уведомления"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-surface border border-border text-muted"
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-loss px-1 text-[11px] font-bold text-white">
                {notifications}
              </span>
            ) : null}
          </button>
        ) : null}
        {initials ? (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>
        ) : null}
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({
  icon: Icon,
  iconColor = "text-primary",
  label,
  value,
  valueColor = "text-foreground",
  onClick,
}: {
  icon: LucideIcon
  iconColor?: string
  label: string
  value: ReactNode
  valueColor?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left active:scale-[0.99] transition-transform"
    >
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-surface-2", iconColor)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm leading-snug text-muted text-pretty">{label}</span>
      <span className={cn("tabular text-2xl font-bold leading-none", valueColor)}>{value}</span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  PnLCard — profit / revenue / expense block                        */
/* ------------------------------------------------------------------ */

export function PnLCard({
  label,
  profit,
  revenue,
  expenses,
  trend,
}: {
  label: string
  profit: number
  revenue: number
  expenses: number
  trend?: number
}) {
  const positive = profit >= 0
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        {typeof trend === "number" ? (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular",
              trend >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss",
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <p className={cn("mt-1 tabular text-2xl font-bold leading-tight", positive ? "text-profit" : "text-loss")}>
        {rub(profit)}
      </p>
      <p className="text-xs text-muted">прибыль</p>
      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Выручка</dt>
          <dd className="tabular text-foreground">{rub(revenue)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Расходы</dt>
          <dd className="tabular text-foreground">{rub(expenses)}</dd>
        </div>
      </dl>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DonutChart — expense breakdown                                    */
/* ------------------------------------------------------------------ */

export type DonutSlice = { label: string; value: number; color: string }

export function DonutChart({ data, total }: { data: DonutSlice[]; total?: number }) {
  const sum = total ?? data.reduce((s, d) => s + d.value, 0)
  const radius = 42
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Распределение расходов">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
          {data.map((d, i) => {
            const frac = sum > 0 ? d.value / sum : 0
            const dash = frac * circ
            const seg = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return seg
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">Расходы</p>
            <p className="tabular text-sm font-bold text-foreground">{rub(sum)}</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 truncate text-muted">{d.label}</span>
            <span className="tabular text-foreground">{rub(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ListRow                                                            */
/* ------------------------------------------------------------------ */

export function ListRow({
  icon: Icon,
  iconColor = "text-primary",
  accent,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon?: LucideIcon
  iconColor?: string
  accent?: string
  title: string
  subtitle?: string
  trailing?: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3.5 text-left active:bg-surface-2 transition-colors"
    >
      {accent ? <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} /> : null}
      {Icon ? (
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2", iconColor)}>
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground">{title}</span>
        {subtitle ? <span className="block truncate text-sm text-muted">{subtitle}</span> : null}
      </span>
      {trailing ?? <ChevronRight className="h-5 w-5 shrink-0 text-muted" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  FilterChips                                                        */
/* ------------------------------------------------------------------ */

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SearchBar                                                          */
/* ------------------------------------------------------------------ */

export function SearchBar({
  placeholder = "Поиск",
  value,
  onChange,
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
      <Search className="h-5 w-5 shrink-0 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  StatusPill                                                         */
/* ------------------------------------------------------------------ */

const STATUS_STYLES = {
  new: "bg-primary/15 text-primary",
  active: "bg-profit/15 text-profit",
  done: "bg-profit/15 text-profit",
  warning: "bg-warning/15 text-warning",
  loss: "bg-loss/15 text-loss",
  muted: "bg-surface-2 text-muted",
} as const

export function StatusPill({ label, tone = "muted" }: { label: string; tone?: keyof typeof STATUS_STYLES }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[tone])}>{label}</span>
  )
}

/* ------------------------------------------------------------------ */
/*  TabBar                                                             */
/* ------------------------------------------------------------------ */

export type TabItem = { key: string; label: string; icon: LucideIcon }

export function TabBar({
  items,
  active,
  onChange,
}: {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-surface/95 px-1 pb-2 pt-1.5 backdrop-blur">
      {items.map((it) => {
        const isActive = it.key === active
        const Icon = it.icon
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5"
          >
            <span
              className={cn(
                "grid h-9 w-12 place-items-center rounded-xl transition-colors",
                isActive ? "bg-primary/15 text-primary" : "text-muted",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={cn("text-[11px] font-medium", isActive ? "text-primary" : "text-muted")}>{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  FAB                                                                */
/* ------------------------------------------------------------------ */

export function FAB({ label, icon: Icon = Plus, onClick }: { label?: string; icon?: LucideIcon; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
    >
      <Icon className="h-5 w-5" />
      {label ? <span>{label}</span> : null}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Icon className="h-7 w-7" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted text-pretty">{description}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SectionLabel                                                       */
/* ------------------------------------------------------------------ */

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-1 pb-2 pt-1 text-base font-bold text-foreground">{children}</h2>
}
