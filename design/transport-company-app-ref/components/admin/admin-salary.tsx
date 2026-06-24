"use client"

import { useMemo, useState } from "react"
import type { Driver, SalaryKind } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { SubScreen } from "@/components/ui/sub-screen"
import { Card, EmptyState } from "@/components/ui/primitives"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Btn } from "@/components/ui/primitives"
import { AmountInput, ChipSelect, Field, TextArea } from "@/components/ui/fields"
import { DateField } from "@/components/ui/date-picker"
import { formatRub, formatDateShort } from "@/lib/format"
import { Wallet, Plus } from "lucide-react"

const KIND_META: Record<SalaryKind, { label: string; sign: string; cls: string }> = {
  accrual: { label: "Начислено", sign: "+", cls: "text-[#34d399]" },
  payment: { label: "Выплата", sign: "−", cls: "text-foreground" },
  debt: { label: "Удержание", sign: "−", cls: "text-[#f87171]" },
}

export function AdminSalary({ onBack }: { onBack: () => void }) {
  const { drivers, salary, addSalaryEntry, toast } = useApp()
  const [openForm, setOpenForm] = useState(false)
  const [driverId, setDriverId] = useState<string>(drivers[0]?.id ?? "")
  const [kind, setKind] = useState<SalaryKind>("payment")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString())
  const [comment, setComment] = useState("")

  // Net balance owed to each driver = accruals − payments − debts.
  const balances = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of drivers) map[d.id] = 0
    for (const e of salary) {
      if (!(e.driverId in map)) map[e.driverId] = 0
      map[e.driverId] += e.kind === "accrual" ? e.amount : -e.amount
    }
    return map
  }, [drivers, salary])

  const submit = () => {
    const driver = drivers.find((d) => d.id === driverId)
    if (!driver || Number(amount) <= 0) return
    addSalaryEntry({
      driverId: driver.id,
      driverName: driver.name,
      kind,
      amount: Number(amount),
      date,
      comment: comment.trim() || undefined,
    })
    toast(`${KIND_META[kind].label} ${formatRub(Number(amount))} сохранено`)
    setOpenForm(false)
    setAmount("")
    setComment("")
  }

  return (
    <SubScreen
      title="Зарплата"
      onBack={onBack}
      action={
        <button
          onClick={() => setOpenForm(true)}
          aria-label="Добавить операцию"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground active:bg-primary/85"
        >
          <Plus size={18} />
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 no-scrollbar">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Баланс по водителям
        </p>
        <div className="mb-5 flex flex-col gap-2">
          {drivers.map((d: Driver) => (
            <Card key={d.id} className="flex items-center justify-between p-3.5">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground tabular">{d.plate}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">К выплате</p>
                <p
                  className={
                    "text-base font-semibold tabular " +
                    ((balances[d.id] ?? 0) > 0 ? "text-[#fbbf24]" : "text-[#34d399]")
                  }
                >
                  {formatRub(Math.max(balances[d.id] ?? 0, 0))}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          История операций
        </p>
        {salary.length === 0 ? (
          <EmptyState icon={<Wallet size={26} />} title="Операций пока нет" />
        ) : (
          <div className="flex flex-col gap-2">
            {salary.map((e) => {
              const m = KIND_META[e.kind]
              return (
                <Card key={e.id} className="flex items-center justify-between p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.driverName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.label} · {formatDateShort(e.date)}
                    </p>
                    {e.comment ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {e.comment}
                      </p>
                    ) : null}
                  </div>
                  <p className={"shrink-0 text-sm font-semibold tabular " + m.cls}>
                    {m.sign}
                    {formatRub(e.amount).replace("₽", "")}₽
                  </p>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet open={openForm} onClose={() => setOpenForm(false)} title="Операция по зарплате">
        <div className="flex flex-col gap-3.5">
          <Field label="Водитель">
            <ChipSelect
              options={drivers.map((d) => ({ value: d.id, label: d.name.split(" ")[0] }))}
              value={driverId}
              onChange={setDriverId}
            />
          </Field>
          <Field label="Тип операции">
            <ChipSelect
              options={[
                { value: "payment", label: "Выплата" },
                { value: "accrual", label: "Начисление" },
                { value: "debt", label: "Удержание" },
              ]}
              value={kind}
              onChange={(v) => setKind(v as SalaryKind)}
            />
          </Field>
          <Field label="Сумма">
            <AmountInput value={amount} onChange={setAmount} />
          </Field>
          <DateField label="Дата" value={date} onChange={setDate} />
          <Field label="Комментарий">
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательно"
            />
          </Field>
          <Btn full disabled={Number(amount) <= 0} onClick={submit}>
            Сохранить
          </Btn>
        </div>
      </BottomSheet>
    </SubScreen>
  )
}
