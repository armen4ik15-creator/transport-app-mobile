"use client"

import { useEffect, useState } from "react"
import type { Category, Role } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Btn } from "@/components/ui/primitives"
import {
  AmountInput,
  ChipSelect,
  Field,
  ListSelect,
  TextArea,
} from "@/components/ui/fields"
import { DateField } from "@/components/ui/date-picker"
import { CATEGORY_META } from "@/lib/format"
import { Camera, Check } from "lucide-react"

// Driver expense chips per spec: ДПС, Платная дорога, Мелкие расходники, Другое
const DRIVER_CATEGORIES: Category[] = ["dps", "other", "wash", "repair"]
const DRIVER_CATEGORY_LABEL: Partial<Record<Category, string>> = {
  dps: "ДПС",
  other: "Платная дорога",
  wash: "Мелкие расходники",
  repair: "Другое",
}
const ADMIN_CATEGORIES: Category[] = [
  "fuel",
  "dps",
  "repair",
  "wash",
  "salary",
  "other",
]

export function ExpenseForm({
  role,
  open,
  onClose,
}: {
  role: Role
  open: boolean
  onClose: () => void
}) {
  const { addTransaction, toast, drivers, currentDriver } = useApp()
  const isDriver = role === "driver"
  const categories = isDriver ? DRIVER_CATEGORIES : ADMIN_CATEGORIES

  const [category, setCategory] = useState<Category | null>(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString())
  const [comment, setComment] = useState("")
  const [driverId, setDriverId] = useState<string>(currentDriver.id)
  const [receipt, setReceipt] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory(null)
      setAmount("")
      setDate(new Date().toISOString())
      setComment("")
      setDriverId(isDriver ? currentDriver.id : drivers[0].id)
      setReceipt(false)
    }
  }, [open, isDriver, currentDriver.id, drivers])

  const canSubmit = category && Number(amount) > 0

  const submit = () => {
    if (!canSubmit) return
    const driver =
      isDriver
        ? currentDriver
        : drivers.find((d) => d.id === driverId) ?? currentDriver
    addTransaction({
      category: category!,
      amount: Number(amount),
      date,
      comment: comment.trim() || undefined,
      driverId: driver.id,
      driverName: driver.name,
      carPlate: driver.plate,
      source: isDriver ? "driver" : "admin",
      status: "manual",
      payStatus: "unpaid",
      // Driver-submitted expenses go to the admin for review.
      ...(isDriver ? { approval: "pending" as const } : {}),
      hasReceipt: receipt,
      ...(category === "fuel" ? { station: "Добавлено вручную" } : {}),
    })
    toast(isDriver ? "Расход отправлен на проверку" : "Расход добавлен")
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isDriver ? "Новый расход" : "Добавить расход"}
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Категория">
          <ChipSelect
            options={categories.map((c) => ({
              value: c,
              label: isDriver
                ? DRIVER_CATEGORY_LABEL[c] ?? CATEGORY_META[c].label
                : CATEGORY_META[c].label,
            }))}
            value={category}
            onChange={setCategory}
          />
          {isDriver ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Топливо добавляется автоматически из Opti. Расход уйдёт на проверку
              администратору.
            </p>
          ) : null}
        </Field>

        {!isDriver ? (
          <Field label="Водитель / машина">
            <ListSelect
              options={drivers.map((d) => ({
                value: d.id,
                label: d.name,
                sub: `${d.plate} • ${d.carModel}`,
              }))}
              value={driverId}
              onChange={setDriverId}
            />
          </Field>
        ) : null}

        <Field label="Сумма">
          <AmountInput value={amount} onChange={setAmount} />
        </Field>

        <DateField label="Дата" value={date} onChange={setDate} />

        <Field label="Комментарий">
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Описание расхода (необязательно)"
          />
        </Field>

        <button
          onClick={() => setReceipt((v) => !v)}
          className="flex items-center justify-between rounded-xl border border-dashed border-border bg-secondary/50 px-3.5 py-3 text-sm active:bg-secondary/70"
        >
          <span className="flex items-center gap-2 text-foreground">
            <Camera size={18} className="text-muted-foreground" />
            {receipt ? "Фото чека прикреплено" : "Прикрепить фото чека"}
          </span>
          {receipt ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check size={13} />
            </span>
          ) : null}
        </button>

        <Btn full disabled={!canSubmit} onClick={submit}>
          Сохранить расход
        </Btn>
      </div>
    </BottomSheet>
  )
}
