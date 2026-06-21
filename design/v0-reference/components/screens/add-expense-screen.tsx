"use client"

import { useState } from "react"
import { Calendar, Camera, Check, Banknote, CreditCard } from "lucide-react"
import {
  EXPENSE_CATEGORIES,
  DRIVERS,
  formatDate,
  type ExpenseCategory,
  type Expense,
  type PayMethod,
} from "@/lib/data"
import { categoryIcon } from "@/lib/icons"
import { Button, Field, Input, Textarea, ScreenHeader } from "@/components/ui-kit"
import { DatePickerSheet } from "@/components/date-picker-sheet"
import { cn } from "@/lib/utils"

export function AddExpenseScreen({
  existing,
  onBack,
  onSave,
}: {
  existing?: Expense | null
  onBack: () => void
  onSave: () => void
}) {
  const [category, setCategory] = useState<ExpenseCategory>(
    existing?.category ?? "repair",
  )
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "")
  const [method, setMethod] = useState<PayMethod>(existing?.method ?? "card")
  const [driverId, setDriverId] = useState(existing?.driverId ?? "")
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString())
  const [note, setNote] = useState(existing?.note ?? "")
  const [picker, setPicker] = useState(false)

  return (
    <div className="relative flex h-full flex-col bg-background">
      <ScreenHeader
        title={existing ? "Изменить расход" : "Новый расход"}
        subtitle="Учёт затрат автопарка"
        onBack={onBack}
      />

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Категория</p>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {EXPENSE_CATEGORIES.map((c) => {
            const Icon = categoryIcon(c.id)
            const active = category === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[11px] font-medium leading-tight transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {c.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Сумма, ₽">
            <Input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="tabular text-lg font-semibold"
            />
          </Field>

          {/* Payment method */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Способ оплаты
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod("cash")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                  method === "cash"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-muted-foreground",
                )}
              >
                <Banknote className="size-4" /> Наличные
              </button>
              <button
                onClick={() => setMethod("card")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                  method === "card"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-muted-foreground",
                )}
              >
                <CreditCard className="size-4" /> Безналичные
              </button>
            </div>
          </div>

          <Field label="Дата">
            <button
              onClick={() => setPicker(true)}
              className="flex min-h-12 items-center gap-2 rounded-xl border border-input bg-background/40 px-3.5 text-sm"
            >
              <Calendar className="size-4 text-muted-foreground" />
              {formatDate(date)}
            </button>
          </Field>

          <Field label="Машина / водитель">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
              <button
                onClick={() => setDriverId("")}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition",
                  driverId === ""
                    ? "border-primary bg-primary/10"
                    : "border-input bg-card",
                )}
              >
                <p className="font-semibold">Без машины</p>
                <p className="text-muted-foreground">общий расход</p>
              </button>
              {DRIVERS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDriverId(d.id)}
                  className={cn(
                    "shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition",
                    driverId === d.id
                      ? "border-primary bg-primary/10"
                      : "border-input bg-card",
                  )}
                >
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-muted-foreground">{d.plate}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Комментарий">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Назначение расхода"
            />
          </Field>

          <button className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-left">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
              <Camera className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Прикрепить чек</p>
              <p className="text-xs text-muted-foreground">Фото или скан</p>
            </div>
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <Button onClick={onSave} className="w-full" disabled={!amount}>
          <Check className="size-4" />
          {existing ? "Сохранить изменения" : "Сохранить расход"}
        </Button>
      </div>

      <DatePickerSheet
        open={picker}
        value={date}
        title="Дата расхода"
        onClose={() => setPicker(false)}
        onSelect={setDate}
      />
    </div>
  )
}
