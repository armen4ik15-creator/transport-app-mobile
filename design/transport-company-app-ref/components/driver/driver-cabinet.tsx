"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav, type NavItem } from "@/components/bottom-nav"
import { ExpenseForm } from "@/components/expense-form"
import { useApp } from "@/components/app-provider"
import { DriverHome } from "./driver-home"
import { DriverExpenses } from "./driver-expenses"
import { DriverOrders } from "./driver-orders"
import { DriverMore, type DriverStack } from "./driver-more"
import { DriverEarnings } from "./driver-earnings"
import { Home, Package, Receipt, MoreHorizontal } from "lucide-react"

const NAV: NavItem[] = [
  { key: "home", label: "Главная", icon: Home },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "expenses", label: "Расходы", icon: Receipt },
  { key: "more", label: "Ещё", icon: MoreHorizontal },
]

const TITLES: Record<string, string> = {
  orders: "Мои заказы",
  expenses: "Мои расходы",
}

export function DriverCabinet() {
  const { currentDriver } = useApp()
  const [tab, setTab] = useState("home")
  const [stack, setStack] = useState<DriverStack | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      {tab === "home" ? (
        <AppHeader
          title={currentDriver.name}
          subtitle={`${currentDriver.plate} • ${currentDriver.carModel}`}
          notificationCount={3}
        />
      ) : tab !== "more" ? (
        <AppHeader title={TITLES[tab]} notificationCount={3} />
      ) : null}

      <main className="relative min-h-0 flex-1">
        {tab === "home" ? <DriverHome /> : null}
        {tab === "orders" ? <DriverOrders /> : null}
        {tab === "expenses" ? <DriverExpenses /> : null}
        {tab === "more" ? <DriverMore onOpen={setStack} onTab={setTab} /> : null}

        {stack === "earnings" ? (
          <DriverEarnings onBack={() => setStack(null)} />
        ) : null}
      </main>

      <BottomNav
        items={NAV}
        active={tab}
        onChange={setTab}
        fab
        onFab={() => setFormOpen(true)}
      />

      <ExpenseForm role="driver" open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
