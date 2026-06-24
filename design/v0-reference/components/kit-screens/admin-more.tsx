"use client"

import { Users, FileSpreadsheet, Briefcase, Bell, Globe, LogOut, Building2, Truck, Boxes, FolderOpen } from "lucide-react"
import { ListRow, SectionLabel } from "@/components/kit"

export function AdminMoreScreen({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      {/* Profile */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-foreground">Aram Grigoryan</p>
          <p className="truncate text-sm text-muted">aram_grigoryan96@bk.ru · Администратор</p>
        </div>
      </div>

      <section>
        <SectionLabel>Операции</SectionLabel>
        <div className="space-y-2.5">
          <ListRow icon={Users} title="Водители" subtitle="Автопарк и контакты" accent="#3b82f6" />
          <ListRow icon={FileSpreadsheet} title="Реестр рейсов" subtitle="ТТН и выгрузка Excel" accent="#10b981" />
          <ListRow icon={Briefcase} title="Финансы" subtitle="Отчёты и зарплаты" accent="#f59e0b" />
          <ListRow icon={Bell} title="Уведомления" subtitle="События и долги" accent="#8b5cf6" />
        </div>
      </section>

      <section>
        <SectionLabel>Справочники</SectionLabel>
        <div className="space-y-2.5">
          <ListRow icon={Truck} title="Автомобили" subtitle="Техника и госномера" accent="#3b82f6" />
          <ListRow icon={Boxes} title="Материалы" subtitle="Песок, щебень, ПГС" accent="#10b981" />
          <ListRow icon={FolderOpen} title="Документы и ТТН" subtitle="Шаблоны и сканы" accent="#f59e0b" />
        </div>
      </section>

      <section>
        <SectionLabel>Система</SectionLabel>
        <div className="space-y-2.5">
          <ListRow icon={Globe} title="Настройки сервера" subtitle="Адрес API" accent="#94a3b8" />
        </div>
      </section>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-loss/40 bg-loss/10 py-3.5 font-semibold text-loss"
      >
        <LogOut className="h-5 w-5" />
        Выйти из аккаунта
      </button>

      <p className="text-center text-xs text-muted">ReestrPro · OTA выключен</p>
    </div>
  )
}
