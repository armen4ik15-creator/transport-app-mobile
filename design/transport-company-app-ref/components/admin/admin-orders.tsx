"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { Refreshable } from "@/components/ui/refreshable"
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives"
import { OrderCard } from "@/components/order-card"
import { OrderDetail } from "@/components/admin/order-detail"
import { OrderForm } from "@/components/admin/order-form"
import { TextInput } from "@/components/ui/fields"
import type { Order } from "@/lib/types"
import { cn } from "@/lib/utils"
import { PackageX, Plus, Search } from "lucide-react"

type Tab = "active" | "archive"

export function AdminOrders() {
  const { orders, toast } = useApp()
  const [tab, setTab] = useState<Tab>("active")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Order | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const list = useMemo(() => {
    const isActive = (o: Order) => o.status === "new" || o.status === "in_progress"
    return orders
      .filter((o) => (tab === "active" ? isActive(o) : !isActive(o)))
      .filter((o) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          o.number.toLowerCase().includes(q) ||
          o.contractor.toLowerCase().includes(q) ||
          o.material.toLowerCase().includes(q) ||
          (o.driverName ?? "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }, [orders, tab, query])

  return (
    <>
      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-center rounded-xl border border-input bg-secondary px-3.5">
          <Search size={17} className="text-muted-foreground" />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по номеру, контрагенту, водителю"
            className="border-0 bg-transparent px-2 text-sm focus:border-0"
          />
        </div>

        <div className="mt-3 flex gap-1.5 rounded-xl bg-secondary p-1">
          {(
            [
              { id: "active", label: "Активные" },
              { id: "archive", label: "Архив" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 700))
          setLoading(false)
          toast("Заказы обновлены", "info")
        }}
        className="px-4 pb-6 pt-3"
      >
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PackageX size={26} />}
              title={tab === "active" ? "Нет активных заказов" : "Архив пуст"}
              description={
                tab === "active"
                  ? "Создайте новый заказ кнопкой плюс."
                  : "Завершённые и отменённые заказы появятся здесь."
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((o) => (
              <OrderCard key={o.id} order={o} onClick={setDetail} />
            ))}
          </div>
        )}
      </Refreshable>

      <button
        onClick={() => setCreating(true)}
        aria-label="Создать заказ"
        className="absolute bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:bg-primary/85"
      >
        <Plus size={26} />
      </button>

      {detail ? <OrderDetail order={detail} onBack={() => setDetail(null)} /> : null}
      {creating ? <OrderForm onBack={() => setCreating(false)} /> : null}
    </>
  )
}
