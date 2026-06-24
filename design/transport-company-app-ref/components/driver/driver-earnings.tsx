"use client"

import { useMemo } from "react"
import type { SalaryKind } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { SubScreen } from "@/components/ui/sub-screen"
import { Card, EmptyState } from "@/components/ui/primitives"
import { formatRub, formatDateShort } from "@/lib/format"
import { Wallet } from "lucide-react"

const KIND_META: Record<SalaryKind, { label: string; sign: string; cls: string }> = {
  accrual: { label: "Начислено", sign: "+", cls: "text-[#34d399]" },
  payment: { label: "Выплачено", sign: "−", cls: "text-foreground" },
  debt: { label: "Удержание", sign: "−", cls: "text-[#f87171]" },
}

export function DriverEarnings({ onBack }: { onBack: () => void }) {
  const { salary, drivers } = useApp()
  const me = drivers.find((d) => d.id === CURRENT_DRIVER_ID)

  const mine = useMemo(
    () =>
      salary
        .filter((e) => e.driverId === CURRENT_DRIVER_ID)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [salary],
  )

  const accrued = mine.filter((e) => e.kind === "accrual").reduce((s, e) => s + e.amount, 0)
  const paid = mine.filter((e) => e.kind === "payment").reduce((s, e) => s + e.amount, 0)
  const held = mine.filter((e) => e.kind === "debt").reduce((s, e) => s + e.amount, 0)
  const balance = accrued - paid - held

  return (
    <SubScreen title="Мой заработок" subtitle={me?.name} onBack={onBack}>
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 no-scrollbar">
        <Card className="border-[#10b981]/30 bg-[#10b981]/10 p-4">
          <p className="text-xs text-muted-foreground">К выплате сейчас</p>
          <p className="mt-1 text-3xl font-bold tabular text-[#34d399]">
            {formatRub(Math.max(balance, 0))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Оклад: {formatRub(me?.salary ?? 0)} / мес
          </p>
        </Card>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <MiniStat label="Начислено" value={accrued} cls="text-[#34d399]" />
          <MiniStat label="Выплачено" value={paid} cls="text-foreground" />
          <MiniStat label="Удержано" value={held} cls="text-[#f87171]" />
        </div>

        <p className="mb-2 mt-6 text-sm font-medium text-foreground">История начислений</p>
        {mine.length === 0 ? (
          <EmptyState icon={<Wallet size={26} />} title="Операций пока нет" />
        ) : (
          <div className="flex flex-col gap-2">
            {mine.map((e) => {
              const m = KIND_META[e.kind]
              return (
                <Card key={e.id} className="flex items-center justify-between p-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateShort(e.date)}</p>
                    {e.comment ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.comment}</p>
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
    </SubScreen>
  )
}

function MiniStat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={"mt-0.5 text-sm font-semibold tabular " + cls}>{formatRub(value)}</p>
    </Card>
  )
}
