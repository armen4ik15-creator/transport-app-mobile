"use client"

import { useState } from "react"
import { useApp } from "@/components/app-provider"
import { SubScreen } from "@/components/ui/sub-screen"
import { Btn } from "@/components/ui/primitives"
import { AmountInput, Field, ListSelect, TextInput } from "@/components/ui/fields"
import { MATERIALS } from "@/lib/format"
import type { Material } from "@/lib/types"
import { cn } from "@/lib/utils"

export function OrderForm({ onBack }: { onBack: () => void }) {
  const { contractors, drivers, addOrder, toast } = useApp()

  const [contractorId, setContractorId] = useState(contractors[0].id)
  const [material, setMaterial] = useState<Material>("Песок")
  const [volume, setVolume] = useState("")
  const [fromAddress, setFrom] = useState("")
  const [toAddress, setTo] = useState("")
  const [driverRate, setDriverRate] = useState("")
  const [companyRate, setCompanyRate] = useState("")
  const [driverId, setDriverId] = useState<string>("")

  const canSubmit =
    Number(volume) > 0 &&
    fromAddress.trim() &&
    toAddress.trim() &&
    Number(driverRate) > 0 &&
    Number(companyRate) > 0

  const submit = () => {
    if (!canSubmit) return
    const c = contractors.find((x) => x.id === contractorId)!
    const driver = drivers.find((d) => d.id === driverId)
    addOrder({
      contractorId: c.id,
      contractor: c.name,
      material,
      volume: Number(volume),
      fromAddress: fromAddress.trim(),
      toAddress: toAddress.trim(),
      driverRate: Number(driverRate),
      companyRate: Number(companyRate),
      driverId: driver?.id,
      driverName: driver?.name,
      status: driver ? "in_progress" : "new",
      date: new Date().toISOString(),
    })
    toast("Заказ создан", "success")
    onBack()
  }

  return (
    <SubScreen title="Новый заказ" onBack={onBack}>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 pt-4">
        <div className="flex flex-col gap-4">
          <Field label="Контрагент">
            <ListSelect
              options={contractors.map((c) => ({
                value: c.id,
                label: c.name,
                sub: `ИНН ${c.inn}`,
              }))}
              value={contractorId}
              onChange={setContractorId}
            />
          </Field>

          <Field label="Материал">
            <div className="flex flex-wrap gap-1.5">
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                    material === m
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-secondary text-muted-foreground active:bg-secondary/70",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Объём (м³)">
            <AmountInput value={volume} onChange={setVolume} />
          </Field>

          <Field label="Адрес погрузки">
            <TextInput
              value={fromAddress}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Карьер, город"
            />
          </Field>

          <Field label="Адрес разгрузки">
            <TextInput
              value={toAddress}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Объект, город"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ставка водителя (₽/м³)">
              <AmountInput value={driverRate} onChange={setDriverRate} />
            </Field>
            <Field label="Ставка компании (₽/м³)">
              <AmountInput value={companyRate} onChange={setCompanyRate} />
            </Field>
          </div>

          <Field label="Назначить водителя">
            <ListSelect
              options={[
                { value: "", label: "Не назначать", sub: "Назначить позже" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: d.name,
                  sub: `${d.plate} • ${d.carModel}`,
                })),
              ]}
              value={driverId}
              onChange={setDriverId}
            />
          </Field>

          <Btn full disabled={!canSubmit} onClick={submit} className="mt-1">
            Создать заказ
          </Btn>
        </div>
      </div>
    </SubScreen>
  )
}
