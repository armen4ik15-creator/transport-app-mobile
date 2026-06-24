"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/primitives"

export interface HubItem {
  key: string
  label: string
  description?: string
  icon: LucideIcon
  tint: string
  badge?: string
  onClick: () => void
}

/** A list of large tappable rows used by the "Ещё" hub screens. */
export function HubList({ items }: { items: HubItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <Card key={it.key} className="overflow-hidden">
            <button
              onClick={it.onClick}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-secondary/50"
            >
              <span
                className={
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
                  it.tint
                }
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{it.label}</span>
                {it.description ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {it.description}
                  </span>
                ) : null}
              </span>
              {it.badge ? (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground tabular">
                  {it.badge}
                </span>
              ) : null}
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </button>
          </Card>
        )
      })}
    </div>
  )
}
