"use client"

import { useState } from "react"
import type { Category } from "@/lib/types"
import { CATEGORY_META, formatDateInput } from "@/lib/format"
import { DateField } from "@/components/ui/date-picker"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/components/app-provider"

export interface Filters {
  from: string
  to: string
  category: Category | "all"
  driverId: string | "all"
}

export const EMPTY_FILTERS: Filters = {
  from: "",
  to: "",
  category: "all",
  driverId: "all",
}

export function activeFilterCount(f: Filters): number {
  let n = 0
  if (f.from) n++
  if (f.to) n++
  if (f.category !== "all") n++
  if (f.driverId !== "all") n++
  return n
}

export function TransactionFilter({
  filters,
  onChange,
  showDriver,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  showDriver?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { drivers } = useApp()
  const count = activeFilterCount(filters)

  const categories: (Category | "all")[] = [
    "all",
    "fuel",
    "dps",
    "repair",
    "wash",
    "salary",
    "other",
  ]

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal size={16} className="text-muted-foreground" />
          Фильтры
          {count > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {!open && count > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {filters.from ? (
            <Chip label={`с ${formatDateInput(filters.from)}`} />
          ) : null}
          {filters.to ? <Chip label={`по ${formatDateInput(filters.to)}`} /> : null}
          {filters.category !== "all" ? (
            <Chip label={CATEGORY_META[filters.category].label} />
          ) : null}
          {showDriver && filters.driverId !== "all" ? (
            <Chip label={drivers.find((d) => d.id === filters.driverId)?.name ?? ""} />
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="flex flex-col gap-3.5 border-t border-border px-4 py-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Дата с"
              value={filters.from}
              onChange={(v) => onChange({ ...filters, from: v })}
            />
            <DateField
              label="Дата по"
              value={filters.to}
              onChange={(v) => onChange({ ...filters, to: v })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Тип расхода
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const active = filters.category === c
                return (
                  <button
                    key={c}
                    onClick={() => onChange({ ...filters, category: c })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
                    )}
                  >
                    {c === "all" ? "Все" : CATEGORY_META[c].label}
                  </button>
                )
              })}
            </div>
          </div>

          {showDriver ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Водитель
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onChange({ ...filters, driverId: "all" })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filters.driverId === "all"
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
                  )}
                >
                  Все
                </button>
                {drivers.map((d) => {
                  const active = filters.driverId === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => onChange({ ...filters, driverId: d.id })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
                      )}
                    >
                      {d.name.split(" ")[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {count > 0 ? (
            <button
              onClick={() => onChange(EMPTY_FILTERS)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5 text-sm font-medium text-muted-foreground active:bg-secondary/70"
            >
              <X size={15} /> Сбросить фильтры
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground tabular">
      {label}
    </span>
  )
}
