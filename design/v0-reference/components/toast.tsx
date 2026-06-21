"use client"

import { useEffect } from "react"
import { CheckCircle2 } from "lucide-react"

export function Toast({
  message,
  onDone,
}: {
  message: string | null
  onDone: () => void
}) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [message, onDone])

  if (!message) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-positive px-4 py-2.5 text-sm font-semibold text-positive-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
        <CheckCircle2 className="size-4" />
        {message}
      </div>
    </div>
  )
}
