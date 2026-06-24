"use client"

import { useApp } from "@/components/app-provider"
import { SubScreen } from "@/components/ui/sub-screen"
import { Card, EmptyState, Badge } from "@/components/ui/primitives"
import { formatDateShort } from "@/lib/format"
import { UserPlus, Check, X, Phone, Truck, Briefcase } from "lucide-react"

export function AdminRequests({ onBack }: { onBack: () => void }) {
  const { requests, resolveRequest, toast } = useApp()
  const pending = requests.filter((r) => r.status === "pending")
  const resolved = requests.filter((r) => r.status !== "pending")

  return (
    <SubScreen
      title="Заявки на регистрацию"
      subtitle={`${pending.length} ожидают решения`}
      onBack={onBack}
    >
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 no-scrollbar">
        {requests.length === 0 ? (
          <EmptyState icon={<UserPlus size={26} />} title="Заявок нет" />
        ) : (
          <>
            {pending.length > 0 ? (
              <>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ожидают
                </p>
                <div className="mb-5 flex flex-col gap-2.5">
                  {pending.map((r) => (
                    <Card key={r.id} className="p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          {r.kind === "driver" ? <Truck size={18} /> : <Briefcase size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.kind === "driver" ? "Водитель" : "Учредитель"} · {r.detail}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone size={11} /> {r.phone}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDateShort(r.date)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            resolveRequest(r.id, "approved")
                            toast(`Заявка «${r.name}» одобрена`)
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#10b981]/30 bg-[#10b981]/15 px-3 py-2 text-xs font-medium text-[#34d399] active:bg-[#10b981]/25"
                        >
                          <Check size={14} /> Одобрить
                        </button>
                        <button
                          onClick={() => {
                            resolveRequest(r.id, "rejected")
                            toast(`Заявка «${r.name}» отклонена`, "info")
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/15 px-3 py-2 text-xs font-medium text-[#f87171] active:bg-[#ef4444]/25"
                        >
                          <X size={14} /> Отклонить
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}

            {resolved.length > 0 ? (
              <>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Обработанные
                </p>
                <div className="flex flex-col gap-2">
                  {resolved.map((r) => (
                    <Card key={r.id} className="flex items-center justify-between p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.kind === "driver" ? "Водитель" : "Учредитель"} · {r.detail}
                        </p>
                      </div>
                      <Badge
                        className={
                          r.status === "approved"
                            ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30"
                            : "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30"
                        }
                      >
                        {r.status === "approved" ? "Одобрено" : "Отклонено"}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </SubScreen>
  )
}
