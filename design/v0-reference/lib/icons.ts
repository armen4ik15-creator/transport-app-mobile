import {
  Wrench,
  Banknote,
  Route,
  Truck,
  Landmark,
  Ellipsis,
  type LucideIcon,
} from "lucide-react"
import type { ExpenseCategory } from "@/lib/data"

const MAP: Record<ExpenseCategory, LucideIcon> = {
  repair: Wrench,
  salary: Banknote,
  road: Route,
  rent: Truck,
  tax: Landmark,
  other: Ellipsis,
}

export function categoryIcon(id: ExpenseCategory): LucideIcon {
  return MAP[id] ?? Ellipsis
}
