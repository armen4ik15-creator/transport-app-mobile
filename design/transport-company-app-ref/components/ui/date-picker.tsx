"use client"

import { cn } from "@/lib/utils"
import { formatDateInput } from "@/lib/format"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { BottomSheet } from "./bottom-sheet"

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const MONTHS_FULL = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
]

function CalendarGrid({
  value,
  onSelect,
}: {
  value: string
  onSelect: (iso: string) => void
}) {
  const selected = value ? new Date(value) : null
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground active:bg-secondary/70"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">
          {MONTHS_FULL[month]} {year}
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground active:bg-secondary/70"
          aria-label="Следующий месяц"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const isSelected =
            selected &&
            selected.getDate() === d &&
            selected.getMonth() === month &&
            selected.getFullYear() === year
          const isToday =
            today.getDate() === d &&
            today.getMonth() === month &&
            today.getFullYear() === year
          return (
            <button
              key={i}
              onClick={() => {
                const picked = new Date(year, month, d, 12, 0, 0)
                onSelect(picked.toISOString())
              }}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl text-sm tabular transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground active:bg-secondary/70",
                !isSelected && isToday && "ring-1 ring-primary/60",
              )}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = "Выберите дату",
}: {
  label?: string
  value: string
  onChange: (iso: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {label ? (
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      ) : null}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-input bg-secondary px-3.5 py-3 text-left text-sm active:bg-secondary/70"
      >
        <span className={value ? "text-foreground tabular" : "text-muted-foreground"}>
          {value ? formatDateInput(value) : placeholder}
        </span>
        <Calendar size={18} className="text-muted-foreground" />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label || "Дата"}>
        <CalendarGrid
          value={value}
          onSelect={(iso) => {
            onChange(iso)
            setOpen(false)
          }}
        />
      </BottomSheet>
    </div>
  )
}
