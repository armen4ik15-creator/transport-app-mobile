"use client"

import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

export function Refreshable({
  onRefresh,
  children,
  className,
}: {
  onRefresh: () => Promise<void> | void
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const THRESHOLD = 70

  const onTouchStart = (e: React.TouchEvent) => {
    if (ref.current && ref.current.scrollTop <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY
      pulling.current = true
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, 90))
    }
  }
  const onTouchEnd = async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pull >= THRESHOLD) {
      setRefreshing(true)
      setPull(THRESHOLD)
      await onRefresh()
      setRefreshing(false)
    }
    setPull(0)
  }

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto no-scrollbar",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        style={{ height: pull, opacity: pull / THRESHOLD }}
      >
        <RefreshCw
          size={20}
          className={cn(
            "mt-3 text-primary",
            refreshing ? "animate-spin" : "",
          )}
          style={{ transform: `rotate(${pull * 3}deg)` }}
        />
      </div>
      <div
        style={{ transform: `translateY(${pull}px)` }}
        className={cn(!pulling.current && "transition-transform duration-200")}
      >
        {children}
      </div>
    </div>
  )
}
