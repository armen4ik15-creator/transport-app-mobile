"use client"

import { BottomSheet } from "@/components/ui/bottom-sheet"
import { useApp } from "@/components/app-provider"
import { Btn } from "@/components/ui/primitives"
import { LogOut } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  driver: "Водитель",
  admin: "Администратор",
  owner: "Учредитель (Главный)",
}

export function ProfileSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { session, currentDriver, logout, toast } = useApp()
  if (!session) return null

  const isDriver = session.role === "driver"
  const initials = session.name
    .split(" ")
    .map((s) => s[0])
    .join("")

  return (
    <BottomSheet open={open} onClose={onClose} title="Профиль">
      <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-base font-bold text-[#60a5fa]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{session.name}</p>
          <p className="text-sm text-muted-foreground tabular">
            {isDriver ? currentDriver.plate : ROLE_LABEL[session.role]}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Роль</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {ROLE_LABEL[session.role]}
        </p>
        {session.role === "owner" ? (
          <span className="mt-2 inline-flex rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/15 px-2 py-0.5 text-[11px] font-medium text-[#fbbf24]">
            Главный
          </span>
        ) : null}
      </div>

      <Btn
        variant="secondary"
        full
        className="mt-4"
        onClick={() => {
          onClose()
          logout()
          toast("Выход выполнен", "info")
        }}
      >
        <LogOut size={18} />
        Выйти
      </Btn>
    </BottomSheet>
  )
}
