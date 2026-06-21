"use client"

import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Building2,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type Tab =
  | "dashboard"
  | "orders"
  | "expenses"
  | "counterparties"
  | "more"

// All navigable screens (tabs + sub-screens reachable from hubs / quick access).
export type ScreenKey =
  | Tab
  | "drivers"
  | "registry"
  | "finances"
  | "notifications"
  | "add-expense"
  | "create-order"
  | "counterparty-payments"
  | "vehicles"
  | "materials"
  | "documents"
  | "server"
  | "journal"

const ITEMS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "dashboard", label: "Главная", icon: LayoutDashboard },
  { id: "orders", label: "Заказы", icon: ClipboardList },
  { id: "expenses", label: "Расходы", icon: Wallet },
  { id: "counterparties", label: "Контрагенты", icon: Building2 },
  { id: "more", label: "Ещё", icon: MoreHorizontal },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <nav className="flex shrink-0 items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "size-5 transition",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
