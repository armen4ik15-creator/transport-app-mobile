"use client"

import { useApp } from "@/components/app-provider"
import { AppHeader } from "@/components/app-header"
import { Refreshable } from "@/components/ui/refreshable"
import { HubList, type HubItem } from "@/components/ui/hub"
import { Wallet, ClipboardList, FileBarChart, UserPlus, LogOut } from "lucide-react"

export type AdminStack = "salary" | "registry" | "reports" | "requests"

export function AdminMore({ onOpen }: { onOpen: (s: AdminStack) => void }) {
  const { requests, logout } = useApp()
  const pendingRequests = requests.filter((r) => r.status === "pending").length

  const items: HubItem[] = [
    {
      key: "salary",
      label: "Зарплата",
      description: "Начисления и выплаты водителям",
      icon: Wallet,
      tint: "bg-[#10b981]/15 text-[#34d399]",
      onClick: () => onOpen("salary"),
    },
    {
      key: "registry",
      label: "Реестр рейсов",
      description: "Все рейсы с ТТН и объёмами",
      icon: ClipboardList,
      tint: "bg-[#3b82f6]/15 text-[#60a5fa]",
      onClick: () => onOpen("registry"),
    },
    {
      key: "reports",
      label: "Финансовый отчёт",
      description: "Структура расходов и экспорт",
      icon: FileBarChart,
      tint: "bg-[#f59e0b]/15 text-[#fbbf24]",
      onClick: () => onOpen("reports"),
    },
    {
      key: "requests",
      label: "Заявки на регистрацию",
      description: "Новые водители и учредители",
      icon: UserPlus,
      tint: "bg-[#8b94a8]/20 text-[#cbd5e1]",
      badge: pendingRequests ? String(pendingRequests) : undefined,
      onClick: () => onOpen("requests"),
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
