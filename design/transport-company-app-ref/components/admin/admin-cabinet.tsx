"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav, type NavItem } from "@/components/bottom-nav"
import { useApp } from "@/components/app-provider"
import { AdminDashboard } from "./admin-dashboard"
import { AdminOrders } from "./admin-orders"
import { AdminExpenses } from "./admin-expenses"
import { AdminContractors } from "./admin-contractors"
import { AdminMore, type AdminStack } from "./admin-more"
import { AdminSalary } from "./admin-salary"
import { AdminRegistry } from "./admin-registry"
import { AdminReports } from "./admin-reports"
import { AdminRequests } from "./admin-requests"
import { LayoutDashboard, Package, Receipt, Building2, MoreHorizontal } from "lucide-react"

const NAV: NavItem[] = [
  { key: "dashboard", label: "Главная", icon: LayoutDashboard },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "expenses", label: "Расходы", icon: Receipt },
  { key: "contractors", label: "Контрагенты", icon: Building2 },
  { key: "more", label: "Ещё", icon: MoreHorizontal },
]

export function AdminCabinet() {
  const { session } = useApp()
  const [tab, setTab] = useState("dashboard")
  const [stack, setStack] = useState<AdminStack | null>(null)

  return (
    <div className="flex h-full flex-col">
      {tab === "dashboard" ? (
        <AppHeader
          title="Дашборд"
          subtitle={session?.name ?? "Администратор"}
          notificationCount={3}
        />
      ) : null}
      {tab === "orders" ? <AppHeader title="Заказы" notificationCount={3} /> : null}
      {tab === "expenses" ? <AppHeader title="Расходы" notificationCount={3} /> : null}

      <main className="relative min-h-0 flex-1">
        {tab === "dashboard" ? <AdminDashboard /> : null}
        {tab === "orders" ? <AdminOrders /> : null}
        {tab === "expenses" ? <AdminExpenses /> : null}
        {tab === "contractors" ? <AdminContractors /> : null}
        {tab === "more" ? <AdminMore onOpen={setStack} /> : null}

        {stack === "salary" ? <AdminSalary onBack={() => setStack(null)} /> : null}
        {stack === "registry" ? <AdminRegistry onBack={() => setStack(null)} /> : null}
        {stack === "reports" ? <AdminReports onBack={() => setStack(null)} /> : null}
        {stack === "requests" ? <AdminRequests onBack={() => setStack(null)} /> : null}
      </main>

      <BottomNav items={NAV} active={tab} onChange={setTab} />
    </div>
  )
}
