"use client"

import { useState } from "react"
import { Plus, Phone, TrendingUp, Check, X, Calendar } from "lucide-react"
import {
  Card,
  Pill,
  Button,
  ScreenHeader,
  Progress,
  Field,
  Input,
  StatTile,
} from "@/components/ui-kit"
import { DatePickerSheet } from "@/components/date-picker-sheet"
import {
  cpBalance,
  paymentStatus,
  formatRub,
  formatDate,
  iso,
  type Counterparty,
} from "@/lib/data"

// Demo payment history for a counterparty.
function historyFor(c: Counterparty) {
  return [
    { id: "p1", amount: Math.round(c.paid * 0.6), date: iso(8), note: "Оплата по счёту №120" },
    { id: "p2", amount: Math.round(c.paid * 0.4), date: iso(2), note: "Частичная оплата" },
  ].filter((p) => p.amount > 0)
}

export function CounterpartyPaymentsScreen({
  counterparty,
  onBack,
}: {
  counterparty: Counterparty
  onBack: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString())
  const [picker, setPicker] = useState(false)

  const bal = cpBalance(counterparty)
  const status = paymentStatus(counterparty)
  const ratio = counterparty.delivered > 0 ? counterparty.paid / counterparty.delivered : 1
  const history = historyFor(counterparty)

  return (
    <div className="relative flex h-full flex-col bg-background">
      <ScreenHeader
        title={counterparty.name}
        subtitle={`ИНН ${counterparty.inn}`}
        onBack={onBack}
      />

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Навезли" value={formatRub(counterparty.delivered)} />
          <StatTile label="Оплатили" value={formatRub(counterparty.paid)} tone="positive" />
          <StatTile
            label={counterparty.kind === "customer" ? "Долг нам" : "Долг наш"}
            value={formatRub(Math.max(0, bal))}
            tone={bal > 0 ? "warning" : "positive"}
          />
        </div>

        <Card className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Погашение</span>
            <Pill
              tone={
                status === "paid"
                  ? "positive"
                  : status === "partial"
                    ? "warning"
                    : "danger"
              }
            >
              {status === "paid"
                ? "Полностью оплачено"
                : status === "partial"
                  ? "Частично"
                  : "Не оплачено"}
            </Pill>
          </div>
          <div className="mt-2">
            <Progress
              value={ratio}
              tone={status === "paid" ? "positive" : status === "partial" ? "warning" : "danger"}
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" />
            {Math.round(ratio * 100)}% от поставленного оплачено
          </p>
        </Card>

        {counterparty.phone && (
          <a
            href={`tel:${counterparty.phone.replace(/\s/g, "")}`}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border/60"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Телефон</p>
              <p className="text-sm font-semibold">{counterparty.phone}</p>
            </div>
          </a>
        )}

        <div className="mt-5 mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">История платежей</h2>
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary"
          >
            {adding ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {adding ? "Отмена" : "Платёж"}
          </button>
        </div>

        {adding && (
          <Card className="mb-3">
            <div className="flex flex-col gap-3">
              <Field label="Сумма платежа, ₽">
                <Input
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="tabular text-lg font-semibold"
                />
              </Field>
              <Field label="Дата">
                <button
                  type="button"
                  onClick={() => setPicker(true)}
                  className="flex min-h-12 items-center gap-2 rounded-xl border border-input bg-background/40 px-3.5 text-sm"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  {formatDate(date)}
                </button>
              </Field>
              <Button
                disabled={!amount}
                onClick={() => {
                  setAdding(false)
                  setAmount("")
                }}
              >
                <Check className="size-4" /> Сохранить платёж
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Частичные оплаты допускаются — остаток сохранится в долге.
              </p>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-2.5">
          {history.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{p.note}</p>
                <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
              </div>
              <span className="text-sm font-bold tabular text-positive">
                {formatRub(p.amount)}
              </span>
            </Card>
          ))}
        </div>
      </div>

      <DatePickerSheet
        open={picker}
        value={date}
        title="Дата платежа"
        onClose={() => setPicker(false)}
        onSelect={setDate}
      />
    </div>
  )
}
