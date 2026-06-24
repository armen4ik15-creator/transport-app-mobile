"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { ProfileSheet } from "@/components/profile-sheet"
import { useApp } from "@/components/app-provider"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { EmptyState } from "@/components/ui/primitives"

export function AppHeader({
  title,
  subtitle,
  notificationCount = 0,
}: {
  title: string
  subtitle?: string
  notificationCount?: number
}) {
  const { currentDriver, session } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const displayName = session?.name ?? currentDriver.name

  return (
    <header className="shrink-0 border-b border-border bg-background px-4 pb-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground tabular">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground active:bg-secondary/70"
            aria-label="Уведомления"
          >
            <Bell size={19} />
            {notificationCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {notificationCount}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setProfileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-[#60a5fa] active:bg-primary/30"
            aria-label="Профиль"
          >
            {displayName
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)}
          </button>
        </div>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <BottomSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Уведомления"
      >
        <div className="flex flex-col gap-2 pb-2">
          <NotifItem
            title="Новая транзакция из Opti"
            text="Заправка на Лукойл АЗС №112 — 9 840 ₽"
            time="2 мин назад"
            tone="info"
          />
          <NotifItem
            title="Штраф ожидает оплаты"
            text="ДПС 5 000 ₽ — превышение скорости"
            time="1 ч назад"
            tone="warn"
          />
          <NotifItem
            title="Синхронизация завершена"
            text="Добавлено 3 новых транзакции"
            time="Сегодня, 08:15"
            tone="ok"
          />
        </div>
      </BottomSheet>
    </header>
  )
}

function NotifItem({
  title,
  text,
  time,
  tone,
}: {
  title: string
  text: string
  time: string
  tone: "info" | "warn" | "ok"
}) {
  const dot =
    tone === "warn" ? "bg-[#fbbf24]" : tone === "ok" ? "bg-[#34d399]" : "bg-[#60a5fa]"
  return (
    <div className="flex gap-3 rounded-xl bg-secondary px-3.5 py-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{text}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{time}</p>
      </div>
    </div>
  )
}
