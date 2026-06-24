"use client"

import { useMemo, useState } from "react"
import type { Contractor } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { AppHeader } from "@/components/app-header"
import { Refreshable } from "@/components/ui/refreshable"
import { Card, EmptyState } from "@/components/ui/primitives"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Btn } from "@/components/ui/primitives"
import { AmountInput, Field, TextArea } from "@/components/ui/fields"
import { DateField } from "@/components/ui/date-picker"
import { formatRub } from "@/lib/format"
import { Building2, Phone, Search } from "lucide-react"

export function AdminContractors() {
  const { contractors, orders, toast } = useApp()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<Contractor | null>(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString())
  const [comment, setComment] = useState("")

  // Local debt overrides so a recorded payment immediately reduces the balance.
  const [paid, setPaid] = useState<Record<string, number>>({})

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contractors
      .map((c) => ({ ...c, debt: Math.max(c.debt - (paid[c.id] ?? 0), 0) }))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.inn.includes(q),
      )
  }, [contractors, query, paid])

  const totalDebt = list.reduce((s, c) => s + c.debt, 0)

  const openOrders = (id: string) =>
    orders.filter((o) => o.contractorId === id && o.status !== "cancelled").length

  const submit = () => {
    if (!active || Number(amount) <= 0) return
    setPaid((p) => ({ ...p, [active.id]: (p[active.id] ?? 0) + Number(amount) }))
    toast(`Платёж ${formatRub(Number(amount))} от «${active.name}» учтён`)
    setActive(null)
    setAmount("")
    setComment("")
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Контрагенты" subtitle={`Долг по всем: ${formatRub(totalDebt)}`} />

      <Refreshable className="px-4 pb-6 pt-3">
        <div className="relative mb-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или ИНН"
            className="h-11 w-full rounded-xl border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<Building2 size={26} />}
            title="Ничего не найдено"
            description="Измените запрос поиска"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((c) => (
              <Card key={c.id} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular">
                      ИНН {c.inn}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone size={11} /> {c.phone}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-muted-foreground">Долг</p>
                    <p
                      className={
                        "text-base font-semibold tabular " +
                        (c.debt > 0 ? "text-[#fbbf24]" : "text-[#34d399]")
                      }
                    >
                      {formatRub(c.debt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                  <span className="text-xs text-muted-foreground">
                    Активных заказов: {openOrders(c.id)}
                  </span>
                  <button
                    onClick={() => {
                      setActive(c)
                      setAmount(c.debt ? String(c.debt) : "")
                      setDate(new Date().toISOString())
                    }}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground active:bg-secondary/70"
                  >
                    Внести оплату
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Refreshable>

      <BottomSheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Оплата от «${active.name}»` : ""}
      >
        {active ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between rounded-xl bg-secondary px-3.5 py-3">
              <span className="text-xs text-muted-foreground">Текущий долг</span>
              <span className="text-lg font-semibold tabular text-foreground">
                {formatRub(Math.max(active.debt - (paid[active.id] ?? 0), 0))}
              </span>
            </div>
            <Field label="Сумма поступления">
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
              Сохранить платёж
            </Btn>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  )
}
