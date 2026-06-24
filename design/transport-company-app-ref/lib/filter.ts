import type { Transaction } from "./types"
import type { Filters } from "@/components/transaction-filter"

export function applyFilters(txs: Transaction[], f: Filters): Transaction[] {
  return txs.filter((t) => {
    const d = new Date(t.date).getTime()
    if (f.from && d < new Date(f.from).setHours(0, 0, 0, 0)) return false
    if (f.to && d > new Date(f.to).setHours(23, 59, 59, 999)) return false
    if (f.category !== "all" && t.category !== f.category) return false
    if (f.driverId !== "all" && t.driverId !== f.driverId) return false
    return true
  })
}

export function sumBy(txs: Transaction[], predicate: (t: Transaction) => boolean) {
  return txs.filter(predicate).reduce((s, t) => s + t.amount, 0)
}
