# ReestrPro — дизайн в TeleportHQ

> **Цель:** сверстать UI в [teleporthq.io](https://teleporthq.io), получить React-прототип, затем перенести стили и вёрстку в `C:\work\mobile` (React Native APK).

---

## Важно про TeleportHQ

| Что умеет | Что не умеет «из коробки» |
|-----------|---------------------------|
| Визуальный редактор, превью в браузере | Прямой экспорт готового React Native APK |
| Экспорт **React** / Next.js + CSS | Автоподключение к вашему API |
| AI-генерация экранов по промпту | 100% совместимость с Expo без доработки |

**Рабочая схема:** TeleportHQ → React-прототип (референс) → перенос в RN (`StyleSheet`, компоненты, тема).

**Не включать в первую версию дизайна:** топливные карты Opti, синхронизация Opti (модуль отложен).

---

## Шаг 1 — Создать проект на teleporthq.io

1. Зайти на https://teleporthq.io → **Sign up / Log in**
2. **New project** → тип **Web app** (React)
3. В настройках канваса: ширина **390px** (имитация Android)
4. Название проекта: `ReestrPro Mobile UI`

---

## Шаг 2 — Design tokens (вставить в Project Settings / CSS variables)

```css
:root {
  --color-bg: #121212;
  --color-surface: #1E1E1E;
  --color-surface-elevated: #2C2C2C;
  --color-primary: #1A73E8;
  --color-profit: #00C853;
  --color-loss: #FF1744;
  --color-text: #FFFFFF;
  --color-text-muted: #B0B0B0;
  --radius-card: 16px;
  --spacing: 16px;
  --font-family: 'Roboto', system-ui, sans-serif;
}
```

---

## Шаг 3 — Экраны (порядок создания)

Создавайте **отдельную страницу** на каждый экран. Имена — как в таблице (удобно при экспорте).

| # | Страница в TeleportHQ | Существующий экран в приложении | Приоритет |
|---|------------------------|----------------------------------|-----------|
| 1 | `Splash` | загрузка / проверка сессии | P0 |
| 2 | `Login` | `LoginScreen.tsx` | P0 |
| 3 | `Dashboard` | `AdminHomeScreen.tsx` | P0 |
| 4 | `ExpensesList` | `ExpensesScreen.tsx` | P0 |
| 5 | `AddExpense` | форма в `ExpenseFormModal` | P0 |
| 6 | `Reports` | `ReportsScreen.tsx` + batch export | P1 |
| 7 | `ContractorPayments` | `ContractorDebtScreen.tsx` | P1 |
| 8 | `Settings` | `ServerSetupScreen` + профиль | P1 |
| 9 | `BottomNav` | tab bar в `RootNavigator` | P0 |

**Не делать сейчас:** `FuelTransactions`, `OptiSettings`.

---

## Шаг 4 — AI-промпты для TeleportHQ

Скопируйте в AI-чат TeleportHQ **по одному экрану**.

### Общий префикс (добавлять к каждому промпту)

```
Mobile app screen 390px wide, Material Design 3, dark theme.
Background #121212, cards #1E1E1E, primary #1A73E8.
Profit green #00C853, loss red #FF1744.
Roboto font, 16px padding, card radius 16px.
Russian UI labels. Professional finance/logistics style.
```

### Login

```
Login screen: logo "ReestrPro", subtitle "Учёт расходов транспортной компании".
Email field, password field, primary button "Войти".
Link "Забыли пароль?". No test credentials on screen.
Remember session hint: "После входа сессия сохраняется автоматически".
```

### Dashboard (админ)

```
Dashboard: header "Главная".
Large card: profit/loss today and this month (green/red numbers).
Row of category chips: Топливо, ДПС, Обслуживание, Зарплата with amounts.
Quick actions: Расходы, Отчёты, Контрагенты.
Bottom navigation: Главная | Расходы | Отчёты | Ещё (4 tabs).
Do NOT show Opti fuel card sync — feature deferred.
```

### ExpensesList

```
Expense list screen with COLLAPSIBLE header (arrow to collapse filters).
Header when expanded: title "Расходы", filter chips (period, driver, category).
Collapsed: thin bar with active filter summary.
Scrollable list of expense cards: category icon, amount, driver, date.
FAB "+" bottom right. Empty state: "Нет расходов".
Network error banner top: "Нет подключения к интернету".
```

### AddExpense

```
Add expense form. Category chips: Топливо, ДПС (required), Обслуживание, Зарплата.
Date field opens calendar bottom sheet (not text input). Quick buttons: Сегодня, Вчера.
Amount field. Optional: volume and gas station for fuel category.
Driver and vehicle dropdowns. Attach receipt photo button.
Primary button "Сохранить" full width bottom.
```

### Reports

```
Reports screen. Button "Выгрузить всё за сегодня" prominent.
Section "Период": fields From and To — tap opens calendar.
After dates selected: preview "Найдено: 12 записей", button "Скачать Excel".
Keep single-invoice export as secondary link.
```

### ContractorPayments

```
Contractor payments. List of contractors with status badge: Оплачено / Частично / Не оплачено.
Last payment amount and date visible on each row.
Fixed bottom button "Привязать платёж" always visible (never hidden).
Tap opens modal: contractor, amount, date picker, comment, Save.
Payment history list below contractor name.
```

---

## Шаг 5 — Экспорт из TeleportHQ

1. Кнопка **Code** (правый верхний угол)
2. Формат: **React** + **CSS Modules** (или Styled Components — на ваш выбор)
3. **Download ZIP** или **Export to GitHub**
4. Сохранить ZIP в: `C:\work\mobile\design\teleport-export\`

Рекомендуемые настройки экспорта:
- Framework: **React**
- CSS: **CSS Modules**
- Не Next.js — проще смотреть отдельные компоненты

---

## Шаг 6 — Перенос в React Native (делаем мы в Cursor)

После экспорта:

1. Из ZIP берём **цвета, отступы, структуру блоков**
2. Создаём `src/theme/` — tokens из CSS variables
3. Обновляем экраны в `src/screens/` — логика API **не трогается**, меняется только UI
4. Общие компоненты: `Card`, `PrimaryButton`, `CollapsiblePanel`, `ExpenseDatePicker`

---

## Чеклист «готово к переносу»

- [ ] Все экраны P0 сверстаны в TeleportHQ
- [ ] Единые цвета и шрифты на всех страницах
- [ ] Bottom nav на всех главных экранах
- [ ] Collapsible header на ExpensesList
- [ ] DatePicker как bottom sheet на AddExpense
- [ ] Категория «ДПС» видна в форме расхода
- [ ] Нет экранов Opti / топливных карт
- [ ] ZIP экспортирован в `design/teleport-export/`

---

## Что делать прямо сейчас (5 минут)

1. Открыть https://teleporthq.io → New project → Web React, 390px
2. Создать страницу **Login** → вставить промпт Login из раздела 4
3. Создать страницу **ExpensesList** → промпт ExpensesList
4. Когда понравится — **Code → Download ZIP**
5. Положить ZIP сюда и написать в Cursor: «перенеси дизайн из teleport-export в mobile»

---

## Связь с текущим приложением

| TeleportHQ | React Native |
|------------|--------------|
| `Login` | `src/screens/LoginScreen.tsx` |
| `Dashboard` | `src/screens/AdminHomeScreen.tsx` |
| `ExpensesList` | `src/screens/ExpensesScreen.tsx` |
| `AddExpense` | `src/components/expenses/ExpenseFormModal.tsx` |
| `Reports` | `src/screens/ReportsScreen.tsx` |
| `ContractorPayments` | `src/screens/ContractorDebtScreen.tsx` |
| `Settings` | `ServerSetupScreen`, `AdminMoreScreen` |

API: `https://armen4ik15-creator-transport-app-server-43b9.twc1.net/api`
