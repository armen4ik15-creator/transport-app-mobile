"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { useApp } from "@/components/app-provider"
import { CATEGORY_META, formatRub } from "@/lib/format"
import { sumBy } from "@/lib/filter"
import { Refreshable } from "@/components/ui/refreshable"
import { Card } from "@/components/ui/primitives"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import type { Category } from "@/lib/types"
import { Download, FileText, Share2 } from "lucide-react"
import { SubScreen } from "@/components/ui/sub-screen"

const RANGES = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "Квартал" },
] as const

type RangeId = (typeof RANGES)[number]["id"]

const RANGE_DAYS: Record<RangeId, number> = { week: 7, month: 30, quarter: 90 }

export function AdminReports({ onBack }: { onBack?: () => void }) {
  const { transactions, drivers, toast } = useApp()
  const [range, setRange] = useState<RangeId>("month")
  const [exportOpen, setExportOpen] = useState(false)

  const since = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - RANGE_DAYS[range])
    return d.getTime()
  }, [range])

  const inRange = useMemo(
    () => transactions.filter((t) => new Date(t.date).getTime() >= since),
    [transactions, since],
  )

  const total = inRange.reduce((s, t) => s + t.amount, 0)

  const byCategory = useMemo(() => {
    const cats: Category[] = ["fuel", "dps", "repair", "wash", "salary", "other"]
    return cats
      .map((cat) => ({
        cat,
        name: CATEGORY_META[cat].label,
        value: sumBy(inRange, (t) => t.category === cat),
        fill: CATEGORY_META[cat].chart,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [inRange])

  const byDriver = useMemo(
    () =>
      drivers
        .map((d) => ({
          driver: d,
          value: sumBy(inRange, (t) => t.driverId === d.id),
        }))
        .sort((a, b) => b.value - a.value),
    [drivers, inRange],
  )

  const maxDriver = byDriver[0]?.value || 1

  const body = (
    <>
      <Refreshable
        onRefresh={async () => {
          await new Promise((r) => setTimeout(r, 700))
          toast("Отчёты обновлены", "info")
        }}
        className="px-4 pb-6 pt-4"
      >
        {!onBack ? (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Отчёты</h1>
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground active:bg-secondary/70"
            >
              <Share2 size={14} /> Экспорт
            </button>
          </div>
        ) : null}

        {/* range selector */}
        <div className="mt-4 flex gap-1.5 rounded-xl bg-secondary p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                range === r.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Card className="mt-4 p-4">
          <p className="text-xs text-muted-foreground">Всего расходов за период</p>
          <p className="mt-1 text-2xl font-bold tabular text-foreground">
            {formatRub(total)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular">
            {inRange.length} операций
          </p>
        </Card>

        {/* bar chart by category */}
        <p className="mb-2 mt-6 text-sm font-medium text-foreground">
          Структура расходов
        </p>
        <Card className="p-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--secondary)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                  formatter={(v: number) => [formatRub(v), "Сумма"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* by driver */}
        <p className="mb-2 mt-6 text-sm font-medium text-foreground">
          Расходы по водителям
        </p>
        <Card className="flex flex-col gap-3 p-4">
          {byDriver.map(({ driver, value }) => (
            <div key={driver.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground">{driver.name}</span>
                <span className="font-medium tabular text-foreground">
                  {formatRub(value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(value / maxDriver) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </Refreshable>

      <BottomSheet open={exportOpen} onClose={() => setExportOpen(false)} title="Экспорт отчёта">
        <div className="flex flex-col gap-2.5 pb-2">
          <ExportRow
            icon={<FileText size={18} />}
            label="Excel (.xlsx)"
            desc="Полная таблица операций"
            onClick={() => {
              setExportOpen(false)
              toast("Файл Excel сформирован", "success")
            }}
          />
          <ExportRow
            icon={<Download size={18} />}
            label="PDF-отчёт"
            desc="Сводка с графиками"
            onClick={() => {
              setExportOpen(false)
              toast("PDF-отчёт сформирован", "success")
            }}
          />
        </div>
      </BottomSheet>
    </>
  )

  if (onBack) {
    return (
      <SubScreen
        title="Финансовый отчёт"
        onBack={onBack}
        action={
          <button
            onClick={() => setExportOpen(true)}
            aria-label="Экспорт"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground active:bg-secondary/70"
          >
            <Share2 size={16} />
          </button>
        }
      >
        {body}
      </SubScreen>
    )
  }

  return body
}

function ExportRow({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-secondary p-3.5 text-left active:bg-secondary/70"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  )
}
