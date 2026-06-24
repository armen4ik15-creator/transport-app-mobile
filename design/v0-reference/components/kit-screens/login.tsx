"use client"

import { useState } from "react"
import { Truck, Mail, Lock, Eye, EyeOff } from "lucide-react"

export function LoginScreen({ onLogin }: { onLogin?: (role: "admin" | "driver") => void }) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex min-h-full flex-col px-6 pb-10 pt-16">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Truck className="h-8 w-8" />
        </span>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">ReestrPro</h1>
          <p className="mt-1 text-sm text-muted">Управление перевозками и автопарком</p>
        </div>
      </div>

      {/* Form (no wrapping card) */}
      <form
        className="mt-12 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onLogin?.("admin")
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Электронная почта</span>
          <span className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <Mail className="h-5 w-5 shrink-0 text-muted" />
            <input
              type="email"
              defaultValue="aram_grigoryan96@bk.ru"
              placeholder="you@company.ru"
              className="w-full bg-transparent text-foreground placeholder:text-muted focus:outline-none"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Пароль</span>
          <span className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <Lock className="h-5 w-5 shrink-0 text-muted" />
            <input
              type={show ? "text" : "password"}
              defaultValue="••••••••"
              className="w-full bg-transparent text-foreground placeholder:text-muted focus:outline-none"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="text-muted" aria-label="Показать пароль">
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground active:scale-[0.99] transition-transform"
        >
          Войти
        </button>
      </form>

      <div className="mt-6 text-center">
        <button className="text-sm text-primary">Забыли пароль?</button>
      </div>

      {/* Demo role entry (prototype only) */}
      <div className="mt-auto pt-10">
        <p className="mb-2 text-center text-xs text-muted">Демо-вход в прототип</p>
        <div className="flex gap-3">
          <button
            onClick={() => onLogin?.("admin")}
            className="flex-1 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-foreground"
          >
            Администратор
          </button>
          <button
            onClick={() => onLogin?.("driver")}
            className="flex-1 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-foreground"
          >
            Водитель
          </button>
        </div>
      </div>
    </div>
  )
}
