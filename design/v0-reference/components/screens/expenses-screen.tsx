"use client"

import { useState } from "react"
import {
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  Trash2,
  Plus,
  Banknote,
  CreditCard,
} from "lucide-react"
import {
  Card,
  ChipRow,
  Select,
  Button,
  Input,
  Field,
  Fab,
  Pill,
} from "@/components/ui-kit"
import { EmptyState } from "@/components/empty-state"
import { categoryIcon } from "@/lib/icons"
import {
  EXPENSES,
  EXPENSE_CATEGORIES,
  DRIVERS,
  driverById,
  expenseCategoryById,
  formatRub,
  formatDateTime,
  PERIODS,
  inPeriod,
  type PeriodKey,
  type ExpenseCategory,
} from "@/lib/data"

export function ExpensesScreen({
  onAdd,
  onExport,
}: {
  onAdd: () => void
  onExport: (label: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [period, setPeriod] = useState<PeriodKey>("month")
  const [category, setCategory] = useState<ExpenseCategory | "all">("all")
  const [vehicle, setVehicle] = useState("all")

  const list = EXPENSES.filter((e) => {
    if (!inPeriod(e.date, period)) return false
    if (category !== "all" && e.category !== category) return false
    if (vehicle !== "all" && e.driverId !== vehicle) return false
    return true
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const total = list.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="relative flex h-full flex-col">
      {/* Collapsible filter header */}
      <div className="border-b border-border/60 px-4 pb-3 pt-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1.5 text-sm font-semibold"
        >
          Фильтры
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {open && (
          <div className="mt-2 flex flex-col gap-3">
            <ChipRow options={PERIODS} value={period} onChange={setPeriod} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="С">
                <Input type="date" />
              </Field>
              <Field label="По">
                <Input type="date" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ExpenseCategory | "all")
                }
              >
                <option value="all">Все типы</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="all">Все машины</option>
                {DRIVERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.plate}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-10 min-h-10 flex-1 text-xs"
                onClick={() => onExport("Экспорт за период")}
              >
                <FileSpreadsheet className="size-4" /> Экспорт за период
              </Button>
              <Button
                variant="secondary"
                className="h-10 min-h-10 flex-1 text-xs"
                onClick={() => onExport("Пакетный экспорт")}
              >
                <Layers className="size-4" /> Пакетный экспорт
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-xl bg-card px-3.5 py-3 ring-1 ring-border/60">
          <span className="text-xs text-muted-foreground">
            Итого за период · {list.length} записей
          </span>
          <span className="text-base font-bold tabular text-destructive">
            {formatRub(total)}
          </span>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-3">
        {list.length === 0 ? (
          <EmptyState
            title="Расходов нет"
            description="За выбранный период расходы не найдены."
            action={{ label: "Добавить расход", onClick: onAdd }}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((e) => {
              const meta = expenseCategoryById(e.category)
              const Icon = categoryIcon(e.category)
              const drv = driverById(e.driverId)
              return (
                <Card key={e.id} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {e.note || meta.label}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{formatDateTime(e.date)}</span>
                      {drv && <span>· {drv.plate}</span>}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Pill tone="neutral">{meta.label}</Pill>
                      <Pill tone={e.method === "cash" ? "warning" : "info"}>
                        {e.method === "cash" ? (
                          <>
                            <Banknote className="size-3" /> Нал
                          </>
                        ) : (
                          <>
                            <CreditCard className="size-3" /> Безнал
                          </>
                        )}
                      </Pill>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold tabular text-destructive">
                      {formatRub(e.amount)}
                    </span>
                    <button
                      className="text-muted-foreground"
                      aria-label="Удалить расход"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Fab onClick={onAdd} icon={Plus} label="Расход" />
    </div>
  )
}
