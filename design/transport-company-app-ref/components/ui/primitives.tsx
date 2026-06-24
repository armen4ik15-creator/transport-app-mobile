"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"
import {
  Fuel,
  Wrench,
  Droplets,
  Wallet,
  ShieldAlert,
  Receipt,
} from "lucide-react"
import type { ReactNode } from "react"

const CATEGORY_ICON: Record<Category, typeof Fuel> = {
  fuel: Fuel,
  dps: ShieldAlert,
  repair: Wrench,
  wash: Droplets,
  salary: Wallet,
  other: Receipt,
}

const CATEGORY_TINT: Record<Category, string> = {
  fuel: "bg-[#3b82f6]/15 text-[#60a5fa]",
  dps: "bg-[#ef4444]/15 text-[#f87171]",
  repair: "bg-[#f59e0b]/15 text-[#fbbf24]",
  wash: "bg-[#10b981]/15 text-[#34d399]",
  salary: "bg-[#8b94a8]/20 text-[#cbd5e1]",
  other: "bg-muted-foreground/15 text-muted-foreground",
}

export function CategoryIcon({
  category,
  size = 44,
}: {
  category: Category
  size?: number
}) {
  const Icon = CATEGORY_ICON[category]
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        CATEGORY_TINT[category],
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.46} />
    </div>
  )
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        className,
      )}
    >
      {children}
    </span>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success"
  full?: boolean
}

export function Btn({
  variant = "primary",
  full,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground active:bg-primary/85",
    secondary:
      "bg-secondary text-secondary-foreground active:bg-secondary/70 border border-border",
    ghost: "bg-transparent text-foreground active:bg-secondary/60",
    danger: "bg-destructive text-destructive-foreground active:bg-destructive/85",
    success: "bg-success text-success-foreground active:bg-success/85",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50",
        variants[variant],
        full && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-card border border-border", className)}
      {...props}
    >
      {children}
    </div>
  )
}
