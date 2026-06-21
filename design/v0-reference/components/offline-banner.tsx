"use client"

import { WifiOff, RefreshCw } from "lucide-react"

export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2 bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground">
      <WifiOff className="size-4" />
      <span>Нет подключения к интернету</span>
      <button
        onClick={onRetry}
        className="ml-auto flex items-center gap-1 rounded-full bg-background/20 px-2 py-0.5"
      >
        <RefreshCw className="size-3" /> Повторить
      </button>
    </div>
  )
}
