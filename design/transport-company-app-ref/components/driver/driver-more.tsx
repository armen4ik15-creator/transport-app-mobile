"use client"

import { useApp } from "@/components/app-provider"
import { AppHeader } from "@/components/app-header"
import { Refreshable } from "@/components/ui/refreshable"
import { HubList, type HubItem } from "@/components/ui/hub"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { Wallet, ClipboardList, Receipt, LogOut } from "lucide-react"

export type DriverStack = "earnings" | "expenses"

export function DriverMore({
  onOpen,
  onTab,
}: {
  onOpen: (s: DriverStack) => void
  onTab: (tab: string) => void
}) {
  const { logout, salary } = useApp()
  const mine = salary.filter((e) => e.driverId === CURRENT_DRIVER_ID)
  const accrued = mine.filter((e) => e.kind === "accrual").reduce((s, e) => s + e.amount, 0)
  const paid = mine.filter((e) => e.kind === "payment").reduce((s, e) => s + e.amount, 0)
  const held = mine.filter((e) => e.kind === "debt").reduce((s, e) => s + e.amount, 0)
  const balance = Math.max(accrued - paid - held, 0)

  const items: HubItem[] = [
    {
      key: "earnings",
      label: "Мой заработок",
      description: "Начисления и выплаты",
      icon: Wallet,
      tint: "bg-[#10b981]/15 text-[#34d399]",
      badge: balance ? balance.toLocaleString("ru-RU") + " ₽" : undefined,
      onClick: () => onOpen("earnings"),
    },
    {
      key: "expenses",
      label: "Мои расходы",
      description: "Топливо, штрафы, прочее",
      icon: Receipt,
      tint: "bg-[#f59e0b]/15 text-[#fbbf24]",
      onClick: () => onTab("expenses"),
    },
    {
      key: "orders",
      label: "Мои заказы",
      description: "Назначенные рейсы и ТТН",
      icon: ClipboardList,
      tint: "bg-[#3b82f6]/15 text-[#60a5fa]",
      onClick: () => onTab("orders"),
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Ещё" />
      <Refreshable className="px-4 pb-6 pt-3">
        <HubList items={items} />

        <button
          onClick={logout}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-[#f87171] active:bg-secondary/70"
        >
          <LogOut size={16} /> Выйти из аккаунта
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          ТК «Грузоперевозки» · версия 2.0
        </p>
      </Refreshable>
    </div>
  )
}
