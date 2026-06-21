"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import {
  ScreenHeader,
  Field,
  Input,
  Select,
  Textarea,
  Button,
} from "@/components/ui-kit"
import {
  COUNTERPARTIES,
  MATERIALS,
  DRIVERS,
  type Order,
} from "@/lib/data"

export function CreateOrderScreen({
  existing,
  onBack,
  onSave,
}: {
  existing?: Order | null
  onBack: () => void
  onSave: () => void
}) {
  const customers = COUNTERPARTIES.filter((c) => c.kind === "customer")
  const [customer, setCustomer] = useState(existing?.customerId ?? customers[0].id)
  const [material, setMaterial] = useState(existing?.materialId ?? MATERIALS[0].id)
  const [driver, setDriver] = useState(existing?.driverId ?? "")

  return (
    <div className="flex h-full flex-col bg-background">
      <ScreenHeader
        title={existing ? `Заказ ${existing.number}` : "Новый заказ"}
        subtitle={existing ? "Редактирование" : "Заполните данные перевозки"}
        onBack={onBack}
      />

      <form
        className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave()
        }}
      >
        <Field label="Заказчик">
          <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Материал">
            <Select value={material} onChange={(e) => setMaterial(e.target.value)}>
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Объём">
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={existing?.volume}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Адрес загрузки">
          <Input defaultValue={existing?.from} placeholder="Карьер / склад" />
        </Field>
        <Field label="Адрес выгрузки">
          <Input defaultValue={existing?.to} placeholder="Объект доставки" />
        </Field>

        <Field label="Водитель">
          <Select value={driver} onChange={(e) => setDriver(e.target.value)}>
            <option value="">Не назначен</option>
            {DRIVERS.filter((d) => d.active).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.vehicle}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Стоимость заказа, ₽">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={existing?.price}
            placeholder="0"
          />
        </Field>

        <Field label="Комментарий">
          <Textarea placeholder="Особые условия, контакты на объекте…" />
        </Field>

        <Button type="submit" className="w-full">
          <Check className="size-4" />
          {existing ? "Сохранить изменения" : "Создать заказ"}
        </Button>
      </form>
    </div>
  )
}
