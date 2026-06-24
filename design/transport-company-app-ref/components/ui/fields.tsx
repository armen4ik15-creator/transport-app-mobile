"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-input bg-secondary px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring",
        className,
      )}
      {...props}
    />
  )
}

export function AmountInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center rounded-xl border border-input bg-secondary px-3.5 focus-within:border-ring">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="w-full bg-transparent py-3 text-lg font-medium tabular text-foreground placeholder:text-muted-foreground outline-none"
      />
      <span className="pl-2 text-base text-muted-foreground">₽</span>
    </div>
  )
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full resize-none rounded-xl border border-input bg-secondary px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring",
        className,
      )}
      {...props}
    />
  )
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ListSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder = "Выберите",
}: {
  options: { value: T; label: string; sub?: string }[]
  value: T | null
  onChange: (v: T) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/15"
                : "border-border bg-secondary active:bg-secondary/70",
            )}
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{o.label}</span>
              {o.sub ? (
                <span className="block text-xs text-muted-foreground">{o.sub}</span>
              ) : null}
            </span>
            <span
              className={cn(
                "h-4 w-4 rounded-full border-2",
                active ? "border-primary bg-primary" : "border-border",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
