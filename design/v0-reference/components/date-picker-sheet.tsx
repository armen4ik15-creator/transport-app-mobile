"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "./ui-kit"
import { cn } from "@/lib/utils"

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

function startOffset(year: number, month: number): number {
  // Monday-first offset
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

/**
 * Modal bottom-sheet calendar. Replaces manual date typing everywhere.
 * Controlled via `open`. Returns an ISO date string on select.
 */
export function DatePickerSheet({
  open,
  value,
  title = "Выберите дату",
  onClose,
  onSelect,
}: {
  open: boolean
  value?: string
  title?: string
  onClose: () => void
  onSelect: (iso: string) => void
}) {
  const initial = value ? new Date(value) : new Date()
  const [view, setView] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  })

  if (!open) return null

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const offset = startOffset(view.year, view.month)
  const selected = value ? new Date(value) : null
  const today = new Date()

  const prev = () =>
    setView((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 },
    )
  const next = () =>
    setView((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 },
    )

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* scrim */}
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-in fade-in"
      />
      <div className="relative rounded-t-3xl bg-popover p-5 pb-7 animate-in slide-in-from-bottom duration-200">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <button onClick={prev} className="rounded-lg p-2 hover:bg-secondary">
            <ChevronLeft className="size-5" />
          </button>
          <span className="text-sm font-semibold">
            {MONTHS[view.month]} {view.year}
          </span>
          <button onClick={next} className="rounded-lg p-2 hover:bg-secondary">
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-[11px] font-medium text-muted-foreground">
              {w}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const d = new Date(view.year, view.month, day)
            const isSel = selected && isSameDay(d, selected)
            const isToday = isSameDay(d, today)
            return (
              <button
                key={day}
                onClick={() => {
                  onSelect(d.toISOString())
                  onClose()
                }}
                className={cn(
                  "tabular flex aspect-square items-center justify-center rounded-full text-sm transition",
                  isSel
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-secondary",
                  !isSel && isToday && "ring-1 ring-primary/60 text-primary",
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => {
            onSelect(new Date().toISOString())
            onClose()
          }}
        >
          Сегодня
        </Button>
      </div>
    </div>
  )
}
