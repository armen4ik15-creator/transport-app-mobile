"use client"

import { Inbox } from "lucide-react"
import { Button } from "@/components/ui-kit"
import type { ReactNode } from "react"

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
        {icon ?? <Inbox className="size-8 text-muted-foreground" />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
