"use client"

import { cn } from "@/lib/utils"
import { Check, Info, WifiOff, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useApp } from "@/components/app-provider"

export function ToastHost() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg animate-toast-in",
            t.variant === "success" &&
              "border-[#10b981]/40 bg-[#10b981]/15 text-[#a7f3d0]",
            t.variant === "error" &&
              "border-[#ef4444]/40 bg-[#ef4444]/15 text-[#fecaca]",
            t.variant === "info" && "border-border bg-card-elevated text-foreground",
          )}
        >
          <span className="shrink-0">
            {t.variant === "success" ? (
              <Check size={16} />
            ) : t.variant === "error" ? (
              <X size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            className="shrink-0 opacity-70"
            aria-label="Закрыть"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  // Demo toggle: simulate offline every so often is annoying; instead expose via a hidden control.
  useEffect(() => {
    const handler = () => setOffline((v) => v)
    window.addEventListener("online", () => setOffline(false))
    window.addEventListener("offline", () => setOffline(true))
    return () => window.removeEventListener("online", handler)
  }, [])

  if (!offline) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-[#f59e0b]/20 px-4 py-2 text-xs font-medium text-[#fbbf24]">
      <WifiOff size={14} />
      Нет подключения к интернету — данные могут быть неактуальны
    </div>
  )
}
