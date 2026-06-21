"use client"

import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  Card,
  Segmented,
  ChipRow,
  StatTile,
  Progress,
  Button,
  Pill,
} from "@/components/ui-kit"
import {
  financeSummary,
  EXPENSE_CATEGORIES,
  EXPENSES,
  DRIVERS,
  driverSalaryBalance,
  expenseCategoryById,
  formatRub,
  PERIODS,
  type PeriodKey,
} from "@/lib/data"

type Tab = "report" | "salary"

export function FinancesScreen({ onExport }: { onExport: (label: string) => void }) {
  const [tab, setTab] = useState<Tab>("report")
  const [period, setPeriod] = useState<PeriodKey>("month")

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-1">
        <Segmented
          options={[
            { id: "report", label: "Фин. отчёт" },
            { id: "salary", label: "Зарплаты" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <ChipRow options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {tab === "report" ? <Report onExport={onExport} /> : <Salary onExport={onExport} />}
      </div>
    </div>
  )
}

function Report({ onExport }: { onExport: (label: string) => void }) {
  const f = financeSummary()
  const margin = f.revenue > 0 ? (f.profit / f.revenue) * 100 : 0

  // expenses grouped by category
  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: EXPENSES.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
  const maxCat = Math.max(...byCat.map((c) => c.total), 1)

  return (
    <div className="flex flex-col gap-4 pt-1">
      <Card className="bg-primary p-5 ring-0">
        <p className="text-xs font-medium text-primary-foreground/80">
          Прибыль за период
        </p>
        <p className="mt-1 text-3xl font-bold tabular text-primary-foreground">
          {formatRub(f.profit)}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
          <TrendingUp className="size-3.5" /> {margin.toFixed(1)}% маржа
        </span>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Выручка" value={formatRub(f.revenue)} tone="positive" icon={ArrowUpRight} />
        <StatTile label="Расходы" value={formatRub(f.expenses)} tone="danger" icon={ArrowDownRight} />
        <StatTile label="Зарплаты" value={formatRub(f.salary)} tone="warning" icon={Wallet} />
        <StatTile label="Чистыми" value={formatRub(f.profit)} tone="info" icon={TrendingUp} />
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold">Структура расходов</h2>
        <Card className="flex flex-col gap-3">
          {byCat.map((c) => (
            <div key={c.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{expenseCategoryById(c.id).label}</span>
                <span className="font-semibold tabular">{formatRub(c.total)}</span>
              </div>
              <Progress value={c.total / maxCat} tone="info" />
            </div>
          ))}
        </Card>
      </div>

      <Button onClick={() => onExport("Финансовый отчёт")}>
        <FileSpreadsheet className="size-4" /> Выгрузить отчёт в Excel
      </Button>
    </div>
  )
}

function Salary({ onExport }: { onExport: (label: string) => void }) {
  const rows = DRIVERS.filter((d) => d.active).map((d) => ({
    driver: d,
    ...driverSalaryBalance(d.id),
  }))
  const totalDebt = rows.reduce((s, r) => s + Math.max(0, r.debt), 0)
  const totalAccrued = rows.reduce((s, r) => s + r.accrued, 0)
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0)

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Начислено" value={formatRub(totalAccrued)} />
        <StatTile label="Выплачено" value={formatRub(totalPaid)} tone="positive" />
        <StatTile label="К выплате" value={formatRub(totalDebt)} tone="warning" />
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const ratio = r.accrued > 0 ? r.paid / r.accrued : 1
          return (
            <Card key={r.driver.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.driver.name}</p>
                  <p className="text-xs text-muted-foreground">{r.driver.plate}</p>
                </div>
                {r.debt > 0 ? (
                  <Pill tone="warning">Долг {formatRub(r.debt)}</Pill>
                ) : (
                  <Pill tone="positive">Закрыт</Pill>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 text-xs">
                <span className="text-muted-foreground">Начислено</span>
                <span className="text-right font-semibold tabular">{formatRub(r.accrued)}</span>
                <span className="text-muted-foreground">Выплачено</span>
                <span className="text-right font-semibold tabular text-positive">
                  {formatRub(r.paid)}
                </span>
              </div>
              <div className="mt-3">
                <Progress value={ratio} tone={r.debt > 0 ? "warning" : "positive"} />
              </div>
              {r.debt > 0 && (
                <Button variant="secondary" className="mt-3 h-10 min-h-10 w-full text-xs">
                  <Wallet className="size-4" /> Выплатить {formatRub(r.debt)}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <Button onClick={() => onExport("Зарплатная ведомость")}>
        <FileSpreadsheet className="size-4" /> Зарплатная ведомость
      </Button>
    </div>
  )
}
