"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.log("[v0] ErrorBoundary caught:", error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef4444]/15 text-[#f87171]">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="font-medium text-foreground">Что-то пошло не так</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Произошла ошибка, но приложение продолжает работать.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground active:bg-primary/85"
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
