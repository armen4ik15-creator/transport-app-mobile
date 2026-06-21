"use client"

import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react"
import { NOTIFICATIONS, formatDateTime, type NotifyTone } from "@/lib/data"
import { Card, IconBadge, ScreenHeader, type Tone } from "@/components/ui-kit"

const TONE_MAP: Record<NotifyTone, { tone: Tone; icon: typeof Info }> = {
  info: { tone: "info", icon: Info },
  warning: { tone: "warning", icon: CircleAlert },
  positive: { tone: "positive", icon: CircleCheck },
}

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Уведомления" subtitle="События, заказы и долги" onBack={onBack} icon={Bell} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-3">
        <div className="flex flex-col gap-2.5">
          {NOTIFICATIONS.map((n) => {
            const meta = TONE_MAP[n.tone]
            return (
              <Card key={n.id} className="flex items-start gap-3">
                <IconBadge icon={meta.icon} tone={meta.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-destructive" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatDateTime(n.date)}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
