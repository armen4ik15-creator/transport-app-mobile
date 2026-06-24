"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  Approval,
  Contractor,
  ContractorPayment,
  Driver,
  Order,
  PayStatus,
  RegistrationRequest,
  Role,
  SalaryEntry,
  Transaction,
  Trip,
} from "@/lib/types"
import {
  ADMIN_NAME,
  CONTRACTORS,
  CURRENT_DRIVER_ID,
  DRIVERS,
  ORDERS,
  REGISTRATION_REQUESTS,
  SALARY_ENTRIES,
  TRANSACTIONS,
  TRIPS,
} from "@/lib/mock-data"

export interface Toast {
  id: number
  message: string
  variant: "success" | "error" | "info"
}

/** Who is logged in. Drivers see the driver cabinet; admin/owner see the admin cabinet. */
export interface Session {
  role: Role
  name: string
}

interface AppState {
  // auth
  session: Session | null
  login: (role: Role) => void
  logout: () => void

  drivers: Driver[]
  currentDriver: Driver

  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, "id" | "payments">) => void
  deleteTransaction: (id: string) => void
  addPayment: (txId: string, payment: Omit<ContractorPayment, "id">) => void
  setApproval: (txId: string, approval: Approval, reason?: string) => void

  orders: Order[]
  addOrder: (o: Omit<Order, "id" | "number">) => void
  updateOrder: (id: string, patch: Partial<Order>) => void

  trips: Trip[]
  advanceTrip: (tripId: string, patch: Partial<Trip>) => void

  contractors: Contractor[]
  salary: SalaryEntry[]
  addSalaryEntry: (e: Omit<SalaryEntry, "id">) => void

  requests: RegistrationRequest[]
  resolveRequest: (id: string, status: "approved" | "rejected") => void

  toasts: Toast[]
  toast: (message: string, variant?: Toast["variant"]) => void
  dismissToast: (id: number) => void

  dataSource: "mock" | "real"
  setDataSource: (s: "mock" | "real") => void
}

const Ctx = createContext<AppState | null>(null)

function recomputePayStatus(amount: number, payments: ContractorPayment[]): PayStatus {
  const paid = payments.reduce((s, p) => s + p.amount, 0)
  if (paid <= 0) return "unpaid"
  if (paid >= amount) return "paid"
  return "partial"
}

let orderSeq = 1043

export function AppProvider({ children }: { children: ReactNode }) {
  const currentDriver = DRIVERS.find((d) => d.id === CURRENT_DRIVER_ID)!

  const [session, setSession] = useState<Session | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS)
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [trips, setTrips] = useState<Trip[]>(TRIPS)
  const [salary, setSalary] = useState<SalaryEntry[]>(SALARY_ENTRIES)
  const [requests, setRequests] = useState<RegistrationRequest[]>(REGISTRATION_REQUESTS)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dataSource, setDataSource] = useState<"mock" | "real">("mock")

  const toast = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const login = useCallback((role: Role) => {
    setSession({
      role,
      name: role === "driver" ? currentDriver.name : ADMIN_NAME,
    })
  }, [currentDriver.name])

  const logout = useCallback(() => setSession(null), [])

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "payments">) => {
    setTransactions((prev) => [
      { ...tx, id: `tx${Date.now()}`, payments: [] },
      ...prev,
    ])
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addPayment = useCallback(
    (txId: string, payment: Omit<ContractorPayment, "id">) => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== txId) return t
          const payments = [...t.payments, { ...payment, id: `p${Date.now()}` }]
          return { ...t, payments, payStatus: recomputePayStatus(t.amount, payments) }
        }),
      )
    },
    [],
  )

  const setApproval = useCallback(
    (txId: string, approval: Approval, reason?: string) => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txId
            ? { ...t, approval, rejectReason: approval === "rejected" ? reason : undefined }
            : t,
        ),
      )
    },
    [],
  )

  const addOrder = useCallback((o: Omit<Order, "id" | "number">) => {
    orderSeq += 1
    setOrders((prev) => [
      { ...o, id: `o${Date.now()}`, number: `№ ${orderSeq}` },
      ...prev,
    ])
  }, [])

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  const advanceTrip = useCallback((tripId: string, patch: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, ...patch } : t)))
  }, [])

  const addSalaryEntry = useCallback((e: Omit<SalaryEntry, "id">) => {
    setSalary((prev) => [{ ...e, id: `s${Date.now()}` }, ...prev])
  }, [])

  const resolveRequest = useCallback((id: string, status: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      session,
      login,
      logout,
      drivers: DRIVERS,
      currentDriver,
      transactions,
      addTransaction,
      deleteTransaction,
      addPayment,
      setApproval,
      orders,
      addOrder,
      updateOrder,
      trips,
      advanceTrip,
      contractors: CONTRACTORS,
      salary,
      addSalaryEntry,
      requests,
      resolveRequest,
      toasts,
      toast,
      dismissToast,
      dataSource,
      setDataSource,
    }),
    [
      session,
      login,
      logout,
      currentDriver,
      transactions,
      addTransaction,
      deleteTransaction,
      addPayment,
      setApproval,
      orders,
      addOrder,
      updateOrder,
      trips,
      advanceTrip,
      salary,
      addSalaryEntry,
      requests,
      resolveRequest,
      toasts,
      toast,
      dismissToast,
      dataSource,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
