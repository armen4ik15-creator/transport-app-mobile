"use client"

import {
  Building2,
  Users,
  ClipboardList,
  Truck,
  Package,
  FileText,
  Bell,
  Server,
  ScrollText,
  Wallet,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { COMPANY, NOTIFICATIONS } from "@/lib/data"
import { Card, IconBadge, SectionTitle } from "@/components/ui-kit"
import type { ScreenKey } from "@/components/bottom-nav"

interface HubItem {
  key: ScreenKey
  icon: typeof Users
  label: string
  sub: string
  tone: "info" | "positive" | "warning" | "neutral" | "danger"
  badge?: number
}

export function CompanyHubScreen({
  onNavigate,
  onLogout,
}: {
  onNavigate: (k: ScreenKey) => void
  onLogout: () => void
}) {
  const unread = NOTIFICATIONS.filter((n) => !n.read).length

  const sections: { title: string; items: HubItem[] }[] = [
    {
      title: "Операции",
      items: [
        { key: "drivers", icon: Users, label: "Водители", sub: "Автопарк и контакты", tone: "info" },
        { key: "registry", icon: ClipboardList, label: "Реестр рейсов", sub: "ТТН и выгрузка Excel", tone: "positive" },
        { key: "finances", icon: Wallet, label: "Финансы", sub: "Отчёты и зарплаты", tone: "warning" },
        { key: "notifications", icon: Bell, label: "Уведомления", sub: "События и долги", tone: "danger", badge: unread },
      ],
    },
    {
      title: "Справочники",
      items: [
        { key: "vehicles", icon: Truck, label: "Автомобили", sub: "Техника и госномера", tone: "neutral" },
        { key: "materials", icon: Package, label: "Материалы", sub: "Песок, щебень, ПГС", tone: "neutral" },
        { key: "documents", icon: FileText, label: "Документы и ТТН", sub: "Шаблоны и сканы", tone: "neutral" },
      ],
    },
    {
      title: "Система",
      items: [
        { key: "server", icon: Server, label: "Настройки сервера", sub: COMPANY.server, tone: "info" },
        { key: "journal", icon: ScrollText, label: "Журнал действий", sub: "История изменений", tone: "neutral" },
      ],
    },
  ]

  return (
    <div className="no-scrollbar h-full overflow-y-auto pb-24">
      <header className="bg-primary px-4 pb-5 pt-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
            <Building2 className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{COMPANY.name}</h1>
            <p className="truncate text-xs text-primary-foreground/80">
              {COMPANY.user} · {COMPANY.role}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pt-4">
        {sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-2">
            <SectionTitle>{s.title}</SectionTitle>
            <Card className="flex flex-col gap-1 p-1.5">
              {s.items.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`flex items-center gap-3 rounded-xl p-2.5 text-left transition active:scale-[0.99] hover:bg-secondary ${
                    i !== s.items.length - 1 ? "" : ""
                  }`}
                >
                  <IconBadge icon={item.icon} tone={item.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.sub}
                    </span>
                  </span>
                  {item.badge ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </Card>
          </section>
        ))}

        <button
          onClick={onLogout}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-destructive transition active:scale-[0.98]"
        >
          <LogOut className="size-4" /> Выйти из аккаунта
        </button>

        <p className="pb-2 text-center text-xs text-muted-foreground">
          ReestrPro · версия 2.0
        </p>
      </div>
    </div>
  )
}
