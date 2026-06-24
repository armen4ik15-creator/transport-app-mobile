"use client"

import { useEffect, useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { Refreshable } from "@/components/ui/refreshable"
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives"
import { OrderCard } from "@/components/order-card"
import { DriverOrderDetail } from "./driver-order-detail"
import type { Order } from "@/lib/types"
import { PackageX } from "lucide-react"

export function DriverOrders() {
  const { orders, toast } = useApp()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Order | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const mine = useMemo(
    () =>
      orders
        .filter((o) => o.driverId === CURRENT_DRIVER_ID && o.status !== "cancelled")
        .sort((a, b) => {
          const order = (s: Order["status"]) => (s === "in_progress" ? 0 : s === "new" ? 1 : 2)
          return order(a.status) - order(b.status)
        }),
    [orders],
  )

  return (
    <>
      <Refreshable
        onRefresh={async () => {
          setLoading(true)
          await new Promise((r) => setTimeout(r, 700))
          setLoading(false)
          toast("Заказы обновлены", "info")
        }}
        className="px-4 pb-6 pt-4"
      >
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : mine.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PackageX size={26} />}
              title="Нет назначенных заказов"
              description="Когда вам назначат рейс, он появится здесь."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {mine.map((o) => (
              <OrderCard key={o.id} order={o} onClick={setDetail} hideDriver />
            ))}
          </div>
        )}
      </Refreshable>

      {detail ? (
        <DriverOrderDetail order={detail} onBack={() => setDetail(null)} />
      ) : null}
    </>
  )
}
