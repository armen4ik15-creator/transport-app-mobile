"use client"

import { useState } from "react"
import { useApp } from "@/components/app-provider"
import { Btn } from "@/components/ui/primitives"
import { TextInput } from "@/components/ui/fields"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { COMPANY_NAME } from "@/lib/mock-data"
import type { Role } from "@/lib/types"
import { Truck, Server, UserPlus, Lock, Mail, Briefcase, ShieldCheck } from "lucide-react"

export function LoginScreen() {
  const { login, toast } = useApp()
  const [email, setEmail] = useState("ivan@reestrpro.ru")
  const [password, setPassword] = useState("demo1234")
  const [serverOpen, setServerOpen] = useState(false)
  const [regOpen, setRegOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)

  const canSubmit = email.trim().length > 3 && password.length >= 4

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-6 pb-8 pt-16">
      <div className="flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Truck size={30} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">ReestrPro</h1>
        <p className="mt-1 text-sm text-muted-foreground">{COMPANY_NAME}</p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <div className="flex items-center rounded-xl border border-input bg-secondary px-3.5 focus-within:border-ring">
          <Mail size={18} className="text-muted-foreground" />
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border-0 bg-transparent px-2 focus:border-0"
          />
        </div>
        <div className="flex items-center rounded-xl border border-input bg-secondary px-3.5 focus-within:border-ring">
          <Lock size={18} className="text-muted-foreground" />
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="border-0 bg-transparent px-2 focus:border-0"
          />
        </div>

        <Btn full disabled={!canSubmit} onClick={() => setRoleOpen(true)} className="mt-1">
          Войти
        </Btn>

        <button
          onClick={() => setServerOpen(true)}
          className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground active:text-foreground"
        >
          <Server size={16} />
          Настройки сервера
        </button>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={() => setRegOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-sm font-medium text-foreground active:bg-secondary/70"
        >
          <UserPlus size={17} />
          Регистрация водителя
        </button>
      </div>

      {/* Demo role chooser (prototype) */}
      <BottomSheet open={roleOpen} onClose={() => setRoleOpen(false)} title="Выбор кабинета">
        <p className="mb-3 text-xs text-muted-foreground">
          Демо-режим: выберите роль для входа.
        </p>
        <div className="flex flex-col gap-2 pb-2">
          <RoleButton
            icon={<Truck size={20} />}
            title="Водитель"
            sub="Иван Петров • А412ВТ 77"
            onClick={() => enter("driver")}
          />
          <RoleButton
            icon={<Briefcase size={20} />}
            title="Администратор"
            sub="Управление автопарком и финансами"
            onClick={() => enter("admin")}
          />
          <RoleButton
            icon={<ShieldCheck size={20} />}
            title="Учредитель (Главный)"
            sub="Полный доступ + заявки на регистрацию"
            onClick={() => enter("owner")}
          />
        </div>
      </BottomSheet>

      <BottomSheet open={serverOpen} onClose={() => setServerOpen(false)} title="Настройки сервера">
        <div className="flex flex-col gap-3 pb-2">
          <LabeledInput label="Адрес сервера" defaultValue="https://api.reestrpro.ru" />
          <LabeledInput label="Порт" defaultValue="443" />
          <LabeledInput label="Токен Opti" defaultValue="opti_••••••••3271" />
          <Btn full onClick={() => { setServerOpen(false); toast("Настройки сохранены") }}>
            Сохранить
          </Btn>
        </div>
      </BottomSheet>

      <BottomSheet open={regOpen} onClose={() => setRegOpen(false)} title="Регистрация водителя">
        <div className="flex flex-col gap-3 pb-2">
          <LabeledInput label="ФИО" placeholder="Иванов Иван Иванович" />
          <LabeledInput label="Телефон" placeholder="+7 ___ ___-__-__" />
          <LabeledInput label="Гос. номер" placeholder="А000АА 00" />
          <LabeledInput label="Модель ТС" placeholder="КАМАЗ 5490" />
          <Btn
            full
            onClick={() => {
              setRegOpen(false)
              toast("Заявка отправлена администратору", "info")
            }}
          >
            Отправить заявку
          </Btn>
          <p className="text-center text-[11px] text-muted-foreground">
            После одобрения администратором вы получите доступ.
          </p>
        </div>
      </BottomSheet>
    </div>
  )

  function enter(role: Role) {
    setRoleOpen(false)
    login(role)
  }
}

function RoleButton({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-3.5 py-3.5 text-left active:bg-secondary/70"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-[#60a5fa]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

function LabeledInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <TextInput {...props} />
    </div>
  )
}
