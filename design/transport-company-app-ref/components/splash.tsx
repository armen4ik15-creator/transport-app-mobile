"use client"

import { Truck } from "lucide-react"

export function Splash() {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-background animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
        <Truck size={40} />
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight">АвтоПарк</h1>
      <p className="mt-1 text-sm text-muted-foreground">Управление транспортом</p>
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Вход по токену...
      </div>
    </div>
  )
}
