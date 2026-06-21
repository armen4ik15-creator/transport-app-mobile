"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface State {
  hasError: boolean
  message?: string
}

/**
 * Graceful error boundary. Previously the app closed on start with no message;
 * now any render error shows a recoverable fallback screen instead of crashing.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.log("[v0] ErrorBoundary caught:", error.message)
  }

  reset = () => this.setState({ hasError: false, message: undefined })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/15">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Что-то пошло не так</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Произошла ошибка, но приложение продолжает работать. Попробуйте
              обновить экран.
            </p>
          </div>
          {this.state.message && (
            <code className="max-w-full overflow-hidden text-ellipsis rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
              {this.state.message}
            </code>
          )}
          <button
            onClick={this.reset}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-95"
          >
            <RefreshCw className="size-4" /> Обновить экран
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
