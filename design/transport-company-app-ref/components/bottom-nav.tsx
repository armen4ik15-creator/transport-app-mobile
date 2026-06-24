"use client"

import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import type { ComponentType } from "react"

export interface NavItem {
  key: string
  label: string
  icon: ComponentType<{ size?: number }>
}

function NavButton({
  item,
  active,
  onChange,
}: {
  item: NavItem
  active: string
  onChange: (key: string) => void
}) {
  const Icon = item.icon
  const isActive = item.key === active
  return (
    <button
      onClick={() => onChange(item.key)}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
      )}
    >
      <Icon size={22} />
      {item.label}
    </button>
  )
}

/**
 * When `fab` is true, the FAB is rendered in the center slot. An even number
 * of items is expected (2 or 4): half are placed left of the FAB, half right.
 * Otherwise items are evenly spaced with no FAB.
 */
export function BottomNav({
  items,
  active,
  onChange,
  fab,
  onFab,
}: {
  items: NavItem[]
  active: string
  onChange: (key: string) => void
  fab?: boolean
  onFab?: () => void
}) {
  return (
    <nav className="relative z-30 shrink-0 border-t border-border bg-card/95 backdrop-blur">
      {fab ? (
        <button
          onClick={onFab}
          aria-label="Добавить расход"
          className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-card active:bg-primary/85"
        >
          <Plus size={26} />
        </button>
      ) : null}
      {fab ? (
        <div
          className="grid items-stretch px-2 pb-5 pt-2"
          style={{ gridTemplateColumns: `repeat(${items.length + 1}, 1fr)` }}
        >
          {items.slice(0, items.length / 2).map((item) => (
            <NavButton key={item.key} item={item} active={active} onChange={onChange} />
          ))}
          <span aria-hidden />
          {items.slice(items.length / 2).map((item) => (
            <NavButton key={item.key} item={item} active={active} onChange={onChange} />
          ))}
        </div>
      ) : (
        <div
          className="grid items-stretch px-2 pb-5 pt-2"
          style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        >
          {items.map((item) => (
            <NavButton key={item.key} item={item} active={active} onChange={onChange} />
          ))}
        </div>
      )}
    </nav>
  )
}
