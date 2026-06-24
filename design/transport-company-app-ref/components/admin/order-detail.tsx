"use client"

import { useApp } from "@/components/app-provider"
import { SubScreen } from "@/components/ui/sub-screen"
import { Badge, Btn, Card } from "@/components/ui/primitives"
import {
  ORDER_STATUS_META,
  formatDate,
  formatNumber,
  formatRub,
  formatTime,
} from "@/lib/format"
import type { Order } from "@/lib/types"
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react"

const STAGE_LABEL = {
  assigned: "Назначен",
  loading: "Погрузка",
  unloading: "Разгрузка",
  done: "Завершён",
}

export function OrderDetail({
  order,
  onBack,
}: {
  order: Order
  onBack: () => void
}) {
  const { trips, updateOrder, toast } = useApp()
  const status = ORDER_STATUS_META[order.status]
  const orderTrips = trips.filter((t) => t.orderId === order.id)
  const deliveredVolume = orderTrips
    .filter((t) => t.stage === "done")
    .reduce((s, t) => s + t.volume, 0)
  const driverPay = order.driverRate * order.volume
  const companyCharge = order.companyRate * order.volume
  const margin = companyCharge - driverPay

  return (
    <SubScreen
      title={`Заказ ${order.number}`}
      subtitle={order.contractor}
      onBack={onBack}
      action={<Badge className={status.cls}>{status.label}</Badge>}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 pt-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-[#60a5fa]">
              <Package size={16} />
            </span>
            <span className="font-medium">{order.material}</span>
            <span className="text-muted-foreground">•</span>
            <span className="tabular text-muted-foreground">
              {formatNumber(order.volume)} м³
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#34d399]" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Погрузка</p>
                <p className="text-foreground">{order.fromAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight size={15} className="mt-0.5 shrink-0 text-[#f87171]" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Разгрузка</p>
                <p className="text-foreground">{order.toAddress}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm">
            <User size={15} className="text-muted-foreground" />
            <span className="text-foreground">{order.driverName ?? "Не назначен"}</span>
          </div>
        </Card>

        {/* Money */}
        <p className="mb-2 mt-5 text-sm font-medium text-foreground">Расчёт</p>
        <Card className="flex flex-col gap-2 p-4 text-sm">
          <Row label={`Ставка водителя (${order.driverRate} ₽/м³)`} value={formatRub(driverPay)} />
          <Row label={`Ставка компании (${order.companyRate} ₽/м³)`} value={formatRub(companyCharge)} />
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium text-foreground">Маржа</span>
            <span className="font-semibold tabular text-[#34d399]">{formatRub(margin)}</span>
          </div>
        </Card>

        {/* Trips */}
        <div className="mb-2 mt-5 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Рейсы</p>
          <span className="text-xs text-muted-foreground tabular">
            {formatNumber(deliveredVolume)} / {formatNumber(order.volume)} м³
          </span>
        </div>
        {orderTrips.length === 0 ? (
          <Card className="px-4 py-6 text-center text-sm text-muted-foreground">
            Рейсы ещё не начаты
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {orderTrips.map((t) => (
              <Card key={t.id} className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Truck size={15} className="text-muted-foreground" />
                    {formatNumber(t.volume)} м³
                  </span>
                  <Badge
                    className={
                      t.stage === "done"
                        ? "border-[#10b981]/30 bg-[#10b981]/15 text-[#34d399]"
                        : "border-[#f59e0b]/30 bg-[#f59e0b]/15 text-[#fbbf24]"
                    }
                  >
                    {STAGE_LABEL[t.stage]}
                  </Badge>
                </div>
                {t.ttnNumber ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Camera size={13} />
                    ТТН {t.ttnNumber}
                    {t.hasTtnPhoto ? (
                      <CheckCircle2 size={13} className="text-[#34d399]" />
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground tabular">
                  {t.loadedAt ? <span>Погрузка {formatTime(t.loadedAt)}</span> : null}
                  {t.unloadedAt ? <span>Разгрузка {formatTime(t.unloadedAt)}</span> : null}
                </div>
              </Card>
            ))}
          </div>
        )}

        {order.status !== "done" && order.status !== "cancelled" ? (
          <div className="mt-6 flex flex-col gap-2">
            <Btn
              full
              onClick={() => {
                updateOrder(order.id, { status: "done" })
                toast("Заказ завершён", "success")
                onBack()
              }}
            >
              Завершить заказ
            </Btn>
            <Btn
              variant="secondary"
              full
              onClick={() => {
                updateOrder(order.id, { status: "cancelled" })
                toast("Заказ отменён", "info")
                onBack()
              }}
            >
              Отменить заказ
            </Btn>
          </div>
        ) : null}
      </div>
    </SubScreen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular text-foreground">{value}</span>
    </div>
  )
}
