# ReestrPro — дизайн в Figma

> **Emergent** (`app.emergent.sh`) — отдельный прототип, **не** переносим в Figma.  
> Продолжение после лимита: см. `FIGMA-CONTINUE.md` и `design/figma-batch-script.js`

## Design tokens (Material 3, dark)

| Token | Value | Usage |
|-------|-------|--------|
| `bg/primary` | `#121212` | Screen background |
| `surface/default` | `#1E1E1E` | Cards |
| `surface/elevated` | `#2C2C2C` | Chips, inputs |
| `primary` | `#1A73E8` | Buttons, links |
| `profit` | `#00C853` | Positive amounts |
| `loss` | `#FF1744` | Negative amounts |
| `text/primary` | `#FFFFFF` | Headings |
| `text/secondary` | `#B0B0B0` | Captions |
| `radius/card` | `16` | Card corners |
| `spacing/base` | `16` | Padding |

**Frame size:** 390 × 844 (Android phone)

**Font:** Roboto (Regular 14/16, Medium 16, Bold 24/32)

---

## Screens to design (priority)

| Frame name | App screen | Notes |
|------------|------------|-------|
| `01 Splash` | Bootstrap | Logo + skeleton |
| `02 Login` | LoginScreen | Email, password, no test hints |
| `03 Dashboard Admin` | AdminHomeScreen | P/L today & month, category cards |
| `04 Expenses List` | ExpensesScreen | **Collapsible filter header** |
| `05 Add Expense` | ExpenseFormModal | **ДПС** category, date bottom sheet |
| `06 Reports` | ReportsScreen | Today export + period picker |
| `07 Contractor Payments` | ContractorDebtScreen | Always-visible pay button |
| `08 Settings` | AdminMoreScreen | Server URL, profile |

**Exclude (deferred):** Opti fuel cards, FuelTransactions, Opti sync

---

## Components to create in Figma

- `Button/Primary`
- `Button/Secondary`
- `Input/Text`
- `Card/Expense`
- `Chip/Category` (Fuel, DPS, Service, Salary)
- `BottomNav/4-tabs`
- `FAB/Add`
- `Banner/Offline`
- `BottomSheet/DatePicker`
- `Badge/Status` (Paid, Partial, Unpaid)

---

## Handoff → React Native

After design approval:
1. Export specs from Figma (spacing, colors)
2. Update `src/theme/` in `C:\work\mobile`
3. Refactor screens one by one — logic unchanged
