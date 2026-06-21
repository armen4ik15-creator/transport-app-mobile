"use client"

import { useState } from "react"
import { Wifi, ChevronLeft } from "lucide-react"
import { BottomNav, type Tab, type ScreenKey } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/offline-banner"
import { Toast } from "@/components/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { SplashScreen } from "@/components/screens/splash-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { DashboardScreen, type QuickTarget } from "@/components/screens/dashboard-screen"
import { OrdersScreen } from "@/components/screens/orders-screen"
import { CreateOrderScreen } from "@/components/screens/create-order-screen"
import { ExpensesScreen } from "@/components/screens/expenses-screen"
import { AddExpenseScreen } from "@/components/screens/add-expense-screen"
import { CounterpartiesScreen } from "@/components/screens/counterparties-screen"
import { CounterpartyPaymentsScreen } from "@/components/screens/counterparty-payments-screen"
import { DriversScreen } from "@/components/screens/drivers-screen"
import { RegistryScreen } from "@/components/screens/registry-screen"
import { FinancesScreen } from "@/components/screens/finances-screen"
import { NotificationsScreen } from "@/components/screens/notifications-screen"
import { CompanyHubScreen } from "@/components/screens/company-hub-screen"
import { ReferenceScreen } from "@/components/screens/reference-screen"
import { DriverModeScreen } from "@/components/screens/driver-mode-screen"
import type { Counterparty } from "@/lib/data"

type Phase = "splash" | "login" | "app"
type Role = "admin" | "driver"

// Tabs that map to a persistent bottom-nav section.
const TABS: Tab[] = ["dashboard", "orders", "expenses", "counterparties", "more"]

export function MobileApp() {
  const [phase, setPhase] = useState<Phase>("splash")
  const [role, setRole] = useState<Role>("admin")
  // The active screen (a tab or a pushed sub-screen).
  const [screen, setScreen] = useState<ScreenKey>("dashboard")
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [selectedCp, setSelectedCp] = useState<Counterparty | null>(null)
  const [offline, setOffline] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function go(target: ScreenKey) {
    setScreen(target)
    if (TABS.includes(target as Tab)) setActiveTab(target as Tab)
  }

  function onTab(t: Tab) {
    setActiveTab(t)
    setScreen(t === "more" ? "more" : t)
  }

  function backToTab() {
    setScreen(activeTab === "more" ? "more" : activeTab)
  }

  function onQuick(t: QuickTarget) {
    go(t as ScreenKey)
  }

  function logout() {
    setPhase("login")
    setScreen("dashboard")
    setActiveTab("dashboard")
  }

  // ----- Phases -----
  if (phase === "splash") {
    return (
      <PhoneFrame>
        <SplashScreen onDone={() => setPhase("login")} />
      </PhoneFrame>
    )
  }

  if (phase === "login") {
    return (
      <PhoneFrame>
        <LoginScreen
          serverOffline={offline}
          onToggleServer={() => setOffline((o) => !o)}
          onLogin={(r) => {
            setRole(r)
            setPhase("app")
            setScreen("dashboard")
            setActiveTab("dashboard")
          }}
        />
      </PhoneFrame>
    )
  }

  // ----- Driver mode (separate, simplified UI) -----
  if (role === "driver") {
    return (
      <PhoneFrame>
        <ErrorBoundary>
          <div className="relative flex h-full flex-col bg-background">
            <StatusBar offline={offline} onToggle={() => setOffline((o) => !o)} />
            {offline && <OfflineBanner onRetry={() => setOffline(false)} />}
            <div className="relative flex-1 overflow-hidden">
              <DriverModeScreen onLogout={logout} />
            </div>
            <Toast message={toast} onDone={() => setToast(null)} />
          </div>
        </ErrorBoundary>
      </PhoneFrame>
    )
  }

  // ----- Admin / dispatcher mode -----
  const isSubScreen = !TABS.includes(screen as Tab)

  return (
    <PhoneFrame>
      <ErrorBoundary>
        <div className="relative flex h-full flex-col bg-background">
          <StatusBar offline={offline} onToggle={() => setOffline((o) => !o)} />
          {offline && <OfflineBanner onRetry={() => setOffline(false)} />}

          <div className="relative flex-1 overflow-hidden">
            {/* ---- Tab screens ---- */}
            {screen === "dashboard" && (
              <div className="no-scrollbar h-full overflow-y-auto">
                <DashboardScreen onLogout={logout} onQuick={onQuick} />
              </div>
            )}
            {screen === "orders" && (
              <OrdersScreen onCreate={() => go("create-order")} />
            )}
            {screen === "expenses" && (
              <ExpensesScreen
                onAdd={() => go("add-expense")}
                onExport={(label) => setToast(`${label}: файл сформирован`)}
              />
            )}
            {screen === "counterparties" && (
              <CounterpartiesScreen
                onAdd={() => setToast("Добавление контрагента")}
                onOpenPayments={(c) => {
                  setSelectedCp(c)
                  go("counterparty-payments")
                }}
              />
            )}
            {screen === "more" && (
              <CompanyHubScreen onNavigate={go} onLogout={logout} />
            )}

            {/* ---- Sub-screens ---- */}
            {screen === "create-order" && (
              <CreateOrderScreen
                onBack={() => setScreen("orders")}
                onSave={() => {
                  setScreen("orders")
                  setToast("Заказ сохранён")
                }}
              />
            )}
            {screen === "add-expense" && (
              <AddExpenseScreen
                onBack={() => setScreen("expenses")}
                onSave={() => {
                  setScreen("expenses")
                  setToast("Расход сохранён")
                }}
              />
            )}
            {screen === "counterparty-payments" && selectedCp && (
              <CounterpartyPaymentsScreen
                counterparty={selectedCp}
                onBack={() => setScreen("counterparties")}
              />
            )}
            {screen === "drivers" && (
              <BackShell title="Водители" onBack={() => setScreen("more")}>
                <DriversScreen
                  onAdd={() => setToast("Добавление водителя")}
                  onOpenSalary={() => go("finances")}
                />
              </BackShell>
            )}
            {screen === "registry" && (
              <BackShell title="Реестр рейсов" onBack={() => setScreen("more")}>
                <RegistryScreen onExport={() => setToast("Excel-реестр сформирован")} />
              </BackShell>
            )}
            {screen === "finances" && (
              <BackShell title="Финансы" onBack={() => setScreen("more")}>
                <FinancesScreen
                  onExport={(label) => setToast(`${label}: файл сформирован`)}
                />
              </BackShell>
            )}
            {screen === "notifications" && (
              <NotificationsScreen onBack={backToTab} />
            )}
            {(screen === "vehicles" ||
              screen === "materials" ||
              screen === "documents" ||
              screen === "server" ||
              screen === "journal") && (
              <ReferenceScreen screen={screen} onBack={() => setScreen("more")} />
            )}
          </div>

          {/* Bottom nav hidden on pushed full-screen sub-screens */}
          {!isSubScreen && <BottomNav active={activeTab} onChange={onTab} />}

          <Toast message={toast} onDone={() => setToast(null)} />
        </div>
      </ErrorBoundary>
    </PhoneFrame>
  )
}

/** Wraps a tab-style screen with a back header when reached as a sub-screen. */
function BackShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 bg-primary px-4 py-3.5 text-primary-foreground">
        <button
          onClick={onBack}
          className="-ml-1 flex size-9 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Назад"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold">{title}</h1>
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  )
}

function StatusBar({
  offline,
  onToggle,
}: {
  offline: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 pt-3 text-xs font-medium text-muted-foreground">
      <span className="tabular">9:41</span>
      <button
        onClick={onToggle}
        className="flex items-center gap-1"
        title="Переключить статус сети (демо)"
      >
        <Wifi className={offline ? "size-3.5 opacity-40" : "size-3.5"} />
      </button>
    </div>
  )
}

/** Renders the screens inside a centered phone-sized frame for preview. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-0 sm:p-6">
      <div className="relative h-[100dvh] w-full max-w-[420px] overflow-hidden bg-background shadow-2xl sm:h-[860px] sm:rounded-[2.5rem] sm:ring-8 sm:ring-neutral-800">
        {children}
      </div>
    </div>
  )
}
