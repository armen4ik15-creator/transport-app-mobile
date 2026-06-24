"use client"

import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"

/**
 * Full-height pushed screen with a back header. Renders above the active tab
 * content. Used for drill-down flows (order detail, salary, reports, etc.).
 */
export function SubScreen({
  title,
  subtitle,
  onBack,
  action,
  children,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background animate-slide-in">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-3 pb-3 pt-3">
        <button
          onClick={onBack}
          aria-label="Назад"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground active:bg-secondary/70"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold leading-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
