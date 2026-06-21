"use client"

import { useEffect } from "react"
import { Truck } from "lucide-react"

/**
 * Splash screen shown while the persisted auth token is being validated.
 * Solves the old "manual reconnect" problem: the token check is silent and
 * automatic. Auto-advances after a short delay.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-background">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-primary shadow-lg animate-in zoom-in-50 duration-500">
        <Truck className="size-10 text-primary-foreground" />
      </div>
      <div className="text-center animate-in fade-in duration-700">
        <h1 className="text-2xl font-bold tracking-tight">ReestrPro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление перевозками
        </p>
      </div>
      <div className="absolute bottom-16 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        Проверка сессии…
      </div>
    </div>
  )
}
