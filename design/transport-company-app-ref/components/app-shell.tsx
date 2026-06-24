"use client"

import { useEffect, useState } from "react"
import { AppProvider, useApp } from "@/components/app-provider"
import { Splash } from "@/components/splash"
import { ToastHost, OfflineBanner } from "@/components/ui/feedback"
import { DriverCabinet } from "@/components/driver/driver-cabinet"
import { AdminCabinet } from "@/components/admin/admin-cabinet"
import { LoginScreen } from "@/components/login-screen"
import { ErrorBoundary } from "@/components/error-boundary"

function Cabinets() {
  const { session } = useApp()
  if (!session) return <LoginScreen />
  return session.role === "driver" ? <DriverCabinet /> : <AdminCabinet />
}

function PhoneFrame() {
  const [booted, setBooted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-background sm:my-6 sm:h-[900px] sm:max-h-[92vh] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-2xl">
      <ToastHost />
      <OfflineBanner />
      <ErrorBoundary>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {!booted ? <Splash /> : <Cabinets />}
        </div>
      </ErrorBoundary>
    </div>
  )
}

export function AppShell() {
  return (
    <AppProvider>
      <div className="min-h-[100dvh] w-full bg-background sm:flex sm:items-start sm:justify-center">
        <PhoneFrame />
      </div>
    </AppProvider>
  )
}
