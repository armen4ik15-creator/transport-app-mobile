"use client"

import { useMemo, useState } from "react"
import { useApp } from "@/components/app-provider"
import { CURRENT_DRIVER_ID } from "@/lib/mock-data"
import { SubScreen } from "@/components/ui/sub-screen"
import { Badge, Btn, Card } from "@/components/ui/primitives"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Field, TextInput } from "@/components/ui/fields"
import {
  ORDER_STATUS_META,
  formatNumber,
  formatRub,
  formatTime,
} from "@/lib/format"
import type { Order, Trip } from "@/lib/types"
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  MapPin,
  Package,
  Truck,
} from "lucide-react"

const STAGE_LABEL = {
  assigned: "Назначен",
  loading: "В погрузке",
  unloading: "Гружён, в пути",
  done: "Доставлено",
}

export function DriverOrderDetail({
  order,
  onBack,
}: {
  order: Order
  onBack: () => void
}) {
  const { trips, advanceTrip, updateOrder, toast } = useApp()
  const status = ORDER_STATUS_META[order.status]

  const myTrips = useMemo(
    () => trips.filter((t) => t.orderId === order.id && t.driverId === CURRENT_DRIVER_ID),
    [trips, order.id],
  )

  const [ttnTrip, setTtnTrip] = useState<Trip | null>(null)
  const [ttn, setTtn] = useState("")
  const [photo, setPhoto] = useState(false)

  const driverPay = order.driverRate * order.volume
  const delivered = myTrips.filter((t) => t.stage === "done").reduce((s, t) => s + t.volume, 0)

  const startLoading = (t: Trip) => {
    advanceTrip(t.id, { stage: "loading", loadedAt: new Date().toISOString() })
    if (order.status === "new") updateOrder(order.id, { status: "in_progress" })
    toast("Рейс начат — погрузка", "info")
  }

  const submitTtn = () => {
    if (!ttnTrip) return
    advanceTrip(ttnTrip.id, {
      stage: "unloading",
      ttnNumber: ttn.trim() || ttnTrip.ttnNumber,
      hasTtnPhoto: photo || ttnTrip.hasTtnPhoto,
    })
    toast("ТТН прикреплена", "success")
    setTtnTrip(null)
    setTtn("")
    setPhoto(false)
  }

  const finishTrip = (t: Trip) => {
    advanceTrip(t.id, { stage: "done", unloadedAt: new Date().toISOString() })
    toast("Рейс завершён", "success")
  }

  return (
    <SubScreen
      title={`Заказ ${order.number}`}
      subtitle={order.contractor}
      onBack={onBack}
      action={<Badge className={status.cls}>{status.label}</Badge>}
    >
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 no-scrollbar">
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

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Моя ставка</span>
            <span className="font-medium tabular text-foreground">
              {order.driverRate} ₽/м³ · {formatRub(driverPay)}
            </span>
          </div>
        </Card>

        {/* trips with action flow */}
        <div className="mb-2 mt-5 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Мои рейсы</p>
          <span className="text-xs text-muted-foreground tabular">
            {formatNumber(delivered)} / {formatNumber(order.volume)} м³
          </span>
        </div>

        {myTrips.length === 0 ? (
          <Card className="px-4 py-6 text-center text-sm text-muted-foreground">
            Рейсы ещё не назначены
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myTrips.map((t) => (
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
                        : t.stage === "assigned"
                          ? "border-[#3b82f6]/30 bg-[#3b82f6]/15 text-[#60a5fa]"
                          : "border-[#f59e0b]/30 bg-[#f59e0b]/15 text-[#fbbf24]"
                    }
                  >
                    {STAGE_LABEL[t.stage]}
                  </Badge>
                </div>

                {t.ttnNumber ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText size={13} />
                    ТТН {t.ttnNumber}
                    {t.hasTtnPhoto ? (
                      <CheckCircle2 size={13} className="text-[#34d399]" />
                    ) : null}
                  </div>
                ) : null}
                {(t.loadedAt || t.unloadedAt) ? (
                  <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground tabular">
                    {t.loadedAt ? <span>Погрузка {formatTime(t.loadedAt)}</span> : null}
                    {t.unloadedAt ? <span>Разгрузка {formatTime(t.unloadedAt)}</span> : null}
                  </div>
                ) : null}

                {/* stage actions */}
                {t.stage === "assigned" ? (
                  <Btn full className="mt-3" onClick={() => startLoading(t)}>
                    Начать погрузку
                  </Btn>
                ) : null}
                {t.stage === "loading" ? (
                  <Btn
                    full
                    className="mt-3"
                    onClick={() => {
                      setTtnTrip(t)
                      setTtn(t.ttnNumber ?? "")
                      setPhoto(!!t.hasTtnPhoto)
                    }}
                  >
                    <Camera size={16} /> Прикрепить ТТН
                  </Btn>
                ) : null}
                {t.stage === "unloading" ? (
                  <Btn full variant="success" className="mt-3" onClick={() => finishTrip(t)}>
                    Подтвердить разгрузку
                  </Btn>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!ttnTrip} onClose={() => setTtnTrip(null)} title="Товарно-транспортная накладная">
        <div className="flex flex-col gap-3.5">
          <Field label="Номер ТТН">
            <TextInput
              value={ttn}
              onChange={(e) => setTtn(e.target.value)}
              placeholder="Например, 2026-0455"
            />
          </Field>
          <button
            onClick={() => setPhoto((p) => !p)}
            className={
              "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors " +
              (photo
                ? "border-[#10b981]/40 bg-[#10b981]/10"
                : "border-dashed border-border bg-secondary active:bg-secondary/70")
            }
          >
            <span
              className={
                "flex h-10 w-10 items-center justify-center rounded-lg " +
                (photo ? "bg-[#10b981]/20 text-[#34d399]" : "bg-card text-muted-foreground")
              }
            >
              {photo ? <CheckCircle2 size={18} /> : <Camera size={18} />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {photo ? "Фото прикреплено" : "Сфотографировать ТТН"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {photo ? "Нажмите, чтобы убрать" : "Камера или из галереи"}
              </span>
            </span>
          </button>
          <Btn full disabled={!ttn.trim() && !photo} onClick={submitTtn}>
            Сохранить ТТН
          </Btn>
        </div>
      </BottomSheet>
    </SubScreen>
  )
}
