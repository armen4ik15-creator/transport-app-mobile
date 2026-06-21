"use client"

import { cn } from "@/lib/utils"
import { ChevronLeft, type LucideIcon } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

/* ---------- Card ---------- */
export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "destructive" | "positive"

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: {
  children: ReactNode
  variant?: Variant
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
    positive: "bg-positive text-positive-foreground hover:opacity-90",
  }
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Field label + input ---------- */
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-input bg-background/40 px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-xl border border-input bg-background/40 px-3.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-xl border border-input bg-background/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
        className,
      )}
      {...props}
    />
  )
}

/* ---------- Status pill ---------- */
export type Tone = "neutral" | "positive" | "warning" | "danger" | "info"

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-secondary text-muted-foreground",
    positive: "bg-positive/15 text-positive",
    warning: "bg-chart-4/15 text-chart-4",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-primary/15 text-primary",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Section title ---------- */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  )
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-secondary/70", className)} />
  )
}

/* ---------- Segmented control (tabs/filters) ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl bg-secondary p-1",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Chip row (scrollable single-select) ---------- */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Icon badge ---------- */
export function IconBadge({
  icon: Icon,
  tone = "info",
  className,
}: {
  icon: LucideIcon
  tone?: Tone
  className?: string
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-secondary text-muted-foreground",
    positive: "bg-positive/15 text-positive",
    warning: "bg-chart-4/15 text-chart-4",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-primary/15 text-primary",
  }
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
        tones[tone],
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

/* ---------- Stat tile ---------- */
export function StatTile({
  label,
  value,
  tone = "neutral",
  icon: Icon,
}: {
  label: string
  value: string
  tone?: Tone
  icon?: LucideIcon
}) {
  const valueTone: Record<Tone, string> = {
    neutral: "text-foreground",
    positive: "text-positive",
    warning: "text-chart-4",
    danger: "text-destructive",
    info: "text-primary",
  }
  return (
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className={cn("mt-1.5 text-lg font-bold tabular", valueTone[tone])}>
        {value}
      </p>
    </div>
  )
}

/* ---------- Screen header (gradient-free banner) ---------- */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <header className="flex items-center gap-3 bg-primary px-4 py-4 text-primary-foreground">
      {onBack && (
        <button
          onClick={onBack}
          className="-ml-1 flex size-9 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Назад"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {Icon && !onBack && (
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold">{title}</h1>
        {subtitle && (
          <p className="truncate text-xs text-primary-foreground/80">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </header>
  )
}

/* ---------- Floating action button ---------- */
export function Fab({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void
  icon: LucideIcon
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-5 right-4 z-10 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95"
    >
      <Icon className="size-5" />
      {label && <span>{label}</span>}
    </button>
  )
}

/* ---------- List row (settings / hub menu) ---------- */
export function ListRow({
  icon: Icon,
  label,
  sub,
  right,
  tone = "info",
  onClick,
}: {
  icon: LucideIcon
  label: string
  sub?: string
  right?: ReactNode
  tone?: Tone
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border/60 transition active:scale-[0.99]"
    >
      <IconBadge icon={Icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {label}
        </span>
        {sub && (
          <span className="block truncate text-xs text-muted-foreground">
            {sub}
          </span>
        )}
      </span>
      {right}
    </button>
  )
}

/* ---------- Progress bar ---------- */
export function Progress({
  value,
  tone = "positive",
}: {
  value: number // 0..1
  tone?: "positive" | "warning" | "danger" | "info"
}) {
  const tones = {
    positive: "bg-positive",
    warning: "bg-chart-4",
    danger: "bg-destructive",
    info: "bg-primary",
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  )
}
