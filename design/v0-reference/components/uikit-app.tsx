"use client"

import { useState } from "react"
import { Home, Package, Wallet, Building2, MoreHorizontal, Briefcase } from "lucide-react"
import { TabBar, EmptyState, type TabItem } from "@/components/kit"
import { LoginScreen } from "@/components/kit-screens/login"
import { AdminHomeScreen } from "@/components/kit-screens/admin-home"
import { DriverHomeScreen } from "@/components/kit-screens/driver-home"
import { OrdersScreen } from "@/components/kit-screens/orders"
import { AdminMoreScreen } from "@/components/kit-screens/admin-more"

type Role = "admin" | "driver" | null

const ADMIN_TABS: TabItem[] = [
  { key: "home", label: "Главная", icon: Home },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "expenses", label: "Расходы", icon: Wallet },
  { key: "contractors", label: "Контраг.", icon: Building2 },
  { key: "more", label: "Ещё", icon: MoreHorizontal },
]

const DRIVER_TABS: TabItem[] = [
  { key: "home", label: "Главная", icon: Home },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "finances", label: "Финансы", icon: Briefcase },
  { key: "more", label: "Ещё", icon: MoreHorizontal },
]

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center pt-24">
      <EmptyState icon={Package} title={title} description="Экран строится по шаблону из текстового гайда ниже." />
    </div>
  )
}

export function UiKitApp() {
  const [role, setRole] = useState<Role>(null)
  const [tab, setTab] = useState("home")

  if (!role) {
    return (
      <Phone>
        <div className="h-full overflow-y-auto no-scrollbar">
          <LoginScreen
            onLogin={(r) => {
              setRole(r)
              setTab("home")
            }}
          />
        </div>
      </Phone>
    )
  }

  const tabs = role === "admin" ? ADMIN_TABS : DRIVER_TABS

  const renderScreen = () => {
    if (tab === "orders") return <OrdersScreen />
    if (tab === "more") return <AdminMoreScreen onLogout={() => setRole(null)} />
    if (role === "admin") {
      if (tab === "home") return <AdminHomeScreen onNavigate={setTab} />
      if (tab === "expenses") return <Placeholder title="Расходы" />
      if (tab === "contractors") return <Placeholder title="Контрагенты" />
    } else {
      if (tab === "home") return <DriverHomeScreen onNavigate={setTab} />
      if (tab === "finances") return <Placeholder title="Мои финансы" />
    }
    return <Placeholder title="Экран" />
  }

  return (
    <Phone>
      <div className="h-full overflow-y-auto no-scrollbar pb-2">{renderScreen()}</div>
      <TabBar items={tabs} active={tab} onChange={setTab} />
    </Phone>
  )
}

/* Phone frame for desktop preview; full-bleed on mobile */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-0 sm:p-6">
      <div className="relative h-[100dvh] w-full max-w-[390px] overflow-hidden bg-background sm:h-[844px] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
        {children}
      </div>
    </div>
  )
}
