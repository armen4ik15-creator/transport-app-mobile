"use client"

import { useState } from "react"
import { Package, MapPin, User, PackageOpen } from "lucide-react"
import { AppHeader, SearchBar, FilterChips, StatusPill, FAB, EmptyState, cn } from "@/components/kit"

type Order = {
  id: number
  customer: string
  material: string
  route: string
  driver: string
  status: "new" | "active" | "done"
  archived: boolean
}

const ORDERS: Order[] = [
  { id: 22, customer: "ГК СА", material: "Песок карьерный", route: "Карьер Гришино → С. Беговая", driver: "Трофименко К. И. (Т400ЕХ550)", status: "new", archived: false },
  { id: 21, customer: "Рот-Фронт", material: "Щебень 20–40", route: "Карьер Гришино → ул. Лесная", driver: "Арам (Т111ОК)", status: "active", archived: false },
  { id: 19, customer: "Неруд", material: "ПГС", route: "База → объект №4", driver: "Арам (Т111ОК)", status: "active", archived: false },
  { id: 18, customer: "СтройКом", material: "Песок мытый", route: "Карьер → Склад-3", driver: "Трофименко К. И.", status: "new", archived: false },
  { id: 12, customer: "ГК СА", material: "Щебень 5–20", route: "Карьер → объект №1", driver: "Арам (Т111ОК)", status: "done", archived: true },
]

const STATUS_LABEL: Record<Order["status"], string> = { new: "Новый", active: "В работе", done: "Завершён" }

export function OrdersScreen() {
  const [tab, setTab] = useState("active")
  const [query, setQuery] = useState("")

  const list = ORDERS.filter((o) => (tab === "archive" ? o.archived : !o.archived)).filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.material.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="px-4 pb-28">
      <AppHeader title="Заказы" subtitle="Задачи и рейсы" initials="AG" notifications={0} />

      <div className="space-y-3">
        <FilterChips
          options={[
            { key: "active", label: "Активные (13)" },
            { key: "archive", label: "Архив (9)" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <SearchBar placeholder="Поиск по заказчику, материалу…" value={query} onChange={setQuery} />
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <EmptyState icon={PackageOpen} title="Заказов не найдено" description="Измените фильтр или поисковый запрос." />
        ) : (
          list.map((o) => (
            <article key={o.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-foreground">{o.customer}</h3>
                  <p className="text-sm text-muted">
                    #{o.id} · {o.material}
                  </p>
                </div>
                <StatusPill
                  label={STATUS_LABEL[o.status]}
                  tone={o.status === "new" ? "new" : o.status === "active" ? "active" : "muted"}
                />
              </div>

              <div className="mt-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-muted">
                  <MapPin className="h-4 w-4 shrink-0 text-loss" />
                  <span className="min-w-0 truncate text-foreground">{o.route}</span>
                </p>
                <p className="flex items-center gap-2 text-muted">
                  <User className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 truncate">{o.driver}</span>
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
                  Открыть
                </button>
                <button className="flex-1 rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-semibold text-foreground">
                  Изменить
                </button>
                <button className={cn("rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-semibold text-muted")}>
                  В архив
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <FAB label="Создать" icon={Package} />
    </div>
  )
}
