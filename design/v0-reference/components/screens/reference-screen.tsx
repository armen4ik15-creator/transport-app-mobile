"use client"

import {
  Truck,
  Package,
  FileText,
  Server,
  ScrollText,
  type LucideIcon,
} from "lucide-react"
import { DRIVERS, MATERIALS, COMPANY, formatDateTime, iso } from "@/lib/data"
import { Card, IconBadge, Pill, ScreenHeader } from "@/components/ui-kit"
import type { ScreenKey } from "@/components/bottom-nav"

type RefKey = "vehicles" | "materials" | "documents" | "server" | "journal"

const META: Record<RefKey, { title: string; sub: string; icon: LucideIcon }> = {
  vehicles: { title: "Автомобили", sub: "Техника автопарка", icon: Truck },
  materials: { title: "Материалы", sub: "Справочник номенклатуры", icon: Package },
  documents: { title: "Документы и ТТН", sub: "Шаблоны и сканы", icon: FileText },
  server: { title: "Настройки сервера", sub: COMPANY.server, icon: Server },
  journal: { title: "Журнал действий", sub: "История изменений", icon: ScrollText },
}

export function ReferenceScreen({
  screen,
  onBack,
}: {
  screen: ScreenKey
  onBack: () => void
}) {
  const key = screen as RefKey
  const meta = META[key] ?? META.vehicles

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={meta.title} subtitle={meta.sub} onBack={onBack} icon={meta.icon} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-3">
        {key === "vehicles" && (
          <div className="flex flex-col gap-2.5">
            {DRIVERS.map((d) => (
              <Card key={d.id} className="flex items-center gap-3">
                <IconBadge icon={Truck} tone="info" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.vehicle}</p>
                  <p className="text-xs text-muted-foreground">{d.plate} · {d.name}</p>
                </div>
                <Pill tone={d.active ? "positive" : "neutral"}>
                  {d.active ? "В работе" : "На стоянке"}
                </Pill>
              </Card>
            ))}
          </div>
        )}

        {key === "materials" && (
          <div className="flex flex-col gap-2.5">
            {MATERIALS.map((m) => (
              <Card key={m.id} className="flex items-center gap-3">
                <IconBadge icon={Package} tone="warning" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">Единица: {m.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {key === "documents" && (
          <div className="flex flex-col gap-2.5">
            {[
              { name: "Шаблон ТТН (1‑Т)", type: "Шаблон" },
              { name: "Договор поставки.docx", type: "Шаблон" },
              { name: "Скан ТТН-50422.jpg", type: "Скан" },
              { name: "Путевой лист №88.pdf", type: "Документ" },
            ].map((doc) => (
              <Card key={doc.name} className="flex items-center gap-3">
                <IconBadge icon={FileText} tone="neutral" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {key === "server" && (
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Адрес сервера</p>
              <p className="text-sm font-semibold">{COMPANY.server}</p>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm">Статус</span>
              <Pill tone="positive">Онлайн</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Последняя синхронизация</span>
              <span className="text-xs text-muted-foreground">только что</span>
            </div>
          </Card>
        )}

        {key === "journal" && (
          <div className="flex flex-col gap-2.5">
            {[
              { a: "Создан заказ №1042", t: iso(0, 7, 30) },
              { a: "Оплата от ИП Васильев — 480 000 ₽", t: iso(0, 11, 0) },
              { a: "Закрыт рейс ТТН-50422", t: iso(0, 9, 40) },
              { a: "Выплата зарплаты — Алексей Смирнов", t: iso(0, 18, 0) },
            ].map((row, i) => (
              <Card key={i} className="flex items-center gap-3">
                <IconBadge icon={ScrollText} tone="neutral" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.a}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(row.t)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
