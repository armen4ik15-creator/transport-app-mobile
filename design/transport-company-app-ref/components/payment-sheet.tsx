"use client"

import { useEffect, useState } from "react"
import type { Transaction } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Btn } from "@/components/ui/primitives"
import { AmountInput, Field, TextArea, TextInput } from "@/components/ui/fields"
import { DateField } from "@/components/ui/date-picker"
import { formatDateShort, formatRub } from "@/lib/format"
import { History } from "lucide-react"

const CONTRACTORS = [
  "ГИБДД (Госуслуги)",
  'СТО "Грузовик-Сервис"',
  "ИП Морозов А.В.",
  "Лукойл (терминал)",
  "Наличными водителю",
]

export function PaymentSheet({
  tx,
  open,
  onClose,
}: {
  tx: Transaction | null
  open: boolean
  onClose: () => void
}) {
  const { addPayment, toast } = useApp()
  const [contractor, setContractor] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString())
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (open && tx) {
      const paid = tx.payments.reduce((s, p) => s + p.amount, 0)
      const remaining = Math.max(tx.amount - paid, 0)
      setContractor("")
      setAmount(remaining ? String(remaining) : "")
      setDate(new Date().toISOString())
      setComment("")
    }
  }, [open, tx])

  if (!tx) return null

  const paidTotal = tx.payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(tx.amount - paidTotal, 0)
  const canSubmit = contractor.trim() && Number(amount) > 0

  const submit = () => {
    if (!canSubmit) return
    addPayment(tx.id, {
      contractor: contractor.trim(),
      amount: Number(amount),
      date,
      comment: comment.trim() || undefined,
    })
    toast(`Платёж ${formatRub(Number(amount))} прикреплён`)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Платёж контрагенту">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-secondary px-3.5 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Остаток к оплате</p>
          <p className="text-lg font-semibold tabular text-foreground">
            {formatRub(remaining)}
          </p>
        </div>
        <p className="text-right text-xs text-muted-foreground tabular">
          Оплачено {formatRub(paidTotal)}
          <br />
          из {formatRub(tx.amount)}
        </p>
      </div>

      {tx.payments.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <History size={13} /> История платежей
          </p>
          <div className="flex flex-col gap-1.5">
            {tx.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{p.contractor}</span>
                  <span className="text-muted-foreground">{formatDateShort(p.date)}</span>
                </span>
                <span className="shrink-0 font-medium tabular text-foreground">
                  {formatRub(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3.5">
        <Field label="Получатель / контрагент">
          <TextInput
            value={contractor}
            onChange={(e) => setContractor(e.target.value)}
            placeholder="Кому платим"
            list="contractors"
          />
          <datalist id="contractors">
            {CONTRACTORS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CONTRACTORS.slice(0, 3).map((c) => (
              <button
                key={c}
                onClick={() => setContractor(c)}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground active:bg-secondary/70"
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Сумма платежа">
          <AmountInput value={amount} onChange={setAmount} />
        </Field>

        <DateField label="Дата платежа" value={date} onChange={setDate} />

        <Field label="Комментарий">
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Необязательно"
          />
        </Field>

        <Btn full disabled={!canSubmit} onClick={submit}>
          Сохранить платёж
        </Btn>
      </div>
    </BottomSheet>
  )
}
