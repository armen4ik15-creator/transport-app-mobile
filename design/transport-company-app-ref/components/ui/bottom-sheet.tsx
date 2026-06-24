"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect, type ReactNode } from "react"

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[88%] overflow-y-auto no-scrollbar rounded-t-3xl bg-card border-t border-border pb-6 animate-sheet-up",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-5 pb-3 pt-4">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border" />
          <h3 className="mt-2 text-base font-medium text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground active:bg-secondary/70"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  )
}
