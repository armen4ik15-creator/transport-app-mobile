"use client"

import { useState } from "react"
import { Truck, Eye, EyeOff, Server, UserPlus, WifiOff, RefreshCw, Loader2 } from "lucide-react"
import { Button, Field, Input } from "@/components/ui-kit"
import { COMPANY } from "@/lib/data"

type Mode = "login" | "server" | "register"

export function LoginScreen({
  onLogin,
  serverOffline,
  onToggleServer,
}: {
  onLogin: (role: "admin" | "driver") => void
  serverOffline: boolean
  onToggleServer: () => void
}) {
  const [mode, setMode] = useState<Mode>("login")
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState(COMPANY.user)
  const [server, setServer] = useState(COMPANY.server)
  const [loading, setLoading] = useState(false)

  function submit(role: "admin" | "driver") {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(role)
    }, 900)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background px-6 pb-8 pt-14">
      <div className="flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Truck className="size-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">ReestrPro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление перевозками и автопарком
        </p>
      </div>

      {serverOffline && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/15 px-3.5 py-3 text-xs font-medium text-destructive">
          <WifiOff className="size-4 shrink-0" />
          <span className="flex-1">Нет связи с сервером</span>
          <button
            type="button"
            onClick={onToggleServer}
            className="flex items-center gap-1 rounded-full bg-destructive/20 px-2.5 py-1"
          >
            <RefreshCw className="size-3" /> Повторить
          </button>
        </div>
      )}

      {mode === "server" ? (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setMode("login")
          }}
        >
          <Field label="Адрес сервера">
            <Input
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="https://api.company.ru"
              inputMode="url"
            />
          </Field>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Укажите адрес вашего сервера ReestrPro. Приложение автоматически
            синхронизируется при появлении сети.
          </p>
          <Button type="submit">Сохранить</Button>
          <Button variant="ghost" type="button" onClick={() => setMode("login")}>
            Отмена
          </Button>
        </form>
      ) : mode === "register" ? (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit("driver")
          }}
        >
          <Field label="ФИО водителя">
            <Input placeholder="Иванов Иван Иванович" required />
          </Field>
          <Field label="Телефон">
            <Input placeholder="+7 900 000-00-00" inputMode="tel" required />
          </Field>
          <Field label="Гос. номер машины">
            <Input placeholder="А000АА 00" required />
          </Field>
          <Field label="Пароль">
            <Input type="password" placeholder="Придумайте пароль" required />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Зарегистрироваться
          </Button>
          <Button variant="ghost" type="button" onClick={() => setMode("login")}>
            Назад ко входу
          </Button>
        </form>
      ) : (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit("admin")
          }}
        >
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.ru"
              inputMode="email"
              autoComplete="username"
            />
          </Field>
          <Field label="Пароль">
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                defaultValue="demo1234"
                placeholder="Ваш пароль"
                autoComplete="current-password"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>

          <button
            type="button"
            className="-mt-1 self-end text-xs font-medium text-primary"
          >
            Забыли пароль?
          </button>

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Войти
          </Button>

          <button
            type="button"
            onClick={() => submit("driver")}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            Войти как водитель (демо)
          </button>

          <div className="mt-2 flex flex-col gap-2">
            <Button variant="secondary" type="button" onClick={() => setMode("register")}>
              <UserPlus className="size-4" /> Регистрация водителя
            </Button>
            <button
              type="button"
              onClick={() => setMode("server")}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground"
            >
              <Server className="size-3.5" /> Настройки сервера
            </button>
          </div>
        </form>
      )}

      <p className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
        ReestrPro · {COMPANY.name}
      </p>
    </div>
  )
}
