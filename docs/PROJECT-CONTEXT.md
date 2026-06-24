# ReestrPro — полное описание проекта (контекст для дизайн-чата)

## Инструкция для ассистента

**Меняй только UI/UX и стили** в `C:\work\mobile-experimental`.

**Не меняй:** бизнес-логику, `src/api/*`, `src/auth/*`, `RootNavigator.tsx`, структуру навигации, сервер, production-сборку.

**Не добавляй** `@react-navigation/bottom-tabs` — используется кастомный `CustomBottomTabBar`.

| Сборка | Путь | Package | Назначение |
|--------|------|---------|------------|
| **Production** | `C:\work\mobile` | `com.reestrpro.mobile` | v1.2.3 — не трогать |
| **Экспериментальная** | `C:\work\mobile-experimental` | `com.reestrpro.experimental` | только дизайн |
| **Сервер** | `C:\Users\Windows\Desktop\ноое приложене\server` | — | API + БД |

- API production: `https://armen4ik15-creator-transport-app-server-26b3.twc1.net/api`
- PostgreSQL: кластер Timeweb «реестр», публичный хост `186.246.12.45`
- GitHub server: `armen4ik15-creator/transport-app-server`
- GitHub mobile: `armen4ik15-creator/transport-app-mobile`

---

## 1. Назначение приложения

**ReestrPro** — мобильное приложение для транспортной компании (перевозка сыпучих материалов: песок, щебень, ПГС и т.д.).

Система закрывает полный цикл:

- учёт заказов и рейсов с ТТН и фото;
- зарплаты и заработок водителей;
- личные расходы водителей с модерацией и компенсацией;
- операционные расходы компании;
- контрагенты и долги по оплате;
- финансовые отчёты и Excel-экспорт;
- документы, справочники, уведомления, бэкапы.

Стек: **React Native (Expo)** + **Node.js/Express** + **PostgreSQL** (локально возможен SQLite fallback).

---

## 2. Роли и права доступа

| Роль | JWT `role` | Возможности |
|------|------------|-------------|
| **Администратор** | `admin` | Всё: заказы, рейсы, финансы, расходы, зарплаты, контрагенты, отчёты, справочники, модерация, бэкапы |
| **Учредитель (owner)** | `admin` + `users.is_owner = 1` | Как admin; **единственный** одобряет регистрацию новых учредителей |
| **Водитель** | `driver` | Только свои заказы, рейсы, расходы, заработок, документы |

В mobile UI admin и owner выглядят одинаково — различие только на сервере при approve заявок учредителей.

### Регистрация и вход

1. Водитель / учредитель подаёт заявку → статус `pending`.
2. Admin (или owner для учредителей) одобряет.
3. Вход по email + пароль → JWT в AsyncStorage, auto-login при следующем запуске.

Middleware: `authMiddleware` (Bearer JWT), `requireRole('admin')` для админских эндпоинтов.

---

## 3. Навигация (структуру не менять)

**Native Stack** + **кастомный** `CustomBottomTabBar` (не `@react-navigation/bottom-tabs`).

### Админ — 5 вкладок

`Главная` | `Заказы` | `Расходы` | `Контраг.` | `Ещё`

Из «Ещё» и quick access — stack-экраны **без** tab bar:

- Водители, Реестр рейсов, Финансы (hub)
- Заявки на регистрацию, Уведомления
- Справочники (материалы, авто), документы, шаблоны
- Финотчёт, бэкапы, журнал действий, настройки сервера, OTA

### Водитель — 4 вкладки

`Главная` | `Заказы` | `Финансы` | `Ещё`

Stack: детали заказа, создание рейса/ТТН, расходы, заработок, документы, настройки сервера.

Файл навигации: `src/navigation/RootNavigator.tsx` — **не редактировать** при редизайне.

---

## 4. Бизнес-модули

### 4.1 Заказы (`orders`)

**Поля:** контрагент, материал, объём (`quantity`, `unit`), адреса погрузки/выгрузки, `driver_rate` (ставка водителю за рейс), `company_rate` (ставка компании за единицу объёма), водитель, заметки, `distance_km`, `is_active` (архив).

**Статусы:** `pending` → `in_progress` → `completed` / `cancelled`.

**Экраны:** `OrdersScreen`, `OrderCreateScreen`, `OrderEditScreen`, `OrderDetailScreen`, `OrderTemplatesScreen`.

### 4.2 Рейсы (`trips`) — двухшаговый процесс

| Шаг | `stage` | Что делает водитель |
|-----|---------|---------------------|
| 1 | `loading` | Отметка погрузки |
| 2 | `unloading` | Разгрузка: номер ТТН, объём, **фото** |

**Завершённый рейс** (идёт в заработок и отчёты):

```sql
status = 'completed' OR (status IS NULL AND stage = 'unloading')
```

**Начисление водителю за рейс** = `orders.driver_rate` (фиксированная ставка за рейс, **не** умножается на объём).

**Выручка компании за рейс** = `trips.volume × orders.company_rate`.

**Экраны:** `TripCreateScreen`, `DriverTripActionCard`, `TripPhotosScreen`, `AllPhotosScreen`, `RegistryReportScreen`.

### 4.3 Расходы (`expenses`)

#### Типы по источнику (`source`)

| Кто создаёт | `source` | Статус | Учёт |
|-------------|----------|--------|------|
| Водитель | `driver` | `pending` → admin `approved` / `rejected` | Одобренные = **компенсация** в заработке и зарплате |
| Админ | `admin` | сразу `approved` | Расход компании в финотчёте |
| Система (топливо Opti) | `system` | `approved` | Авто из синка топлива (схема есть, API fuel в production может быть не смонтирован) |

#### Категории водителя (`DRIVER_EXPENSE_TYPES`)

`dps`, `toll`, `supplies`, `other` — 4 категории, с фото чека.

#### Категории админа (16 типов в `src/constants/expenseTypes.ts`)

`fuel_card`, `fuel`, `repair`, `parts`, `maintenance`, `platon`, `wash`, `toll`, `fine`, `dps`, `supplies`, `lease`, `bank_fee`, `other`, `salary_other`, `dividend`.

#### Поля записи

`exp_date`, `exp_type`, `amount`, `comment`, `driver_id`, `car_number`, `method` (cash/noncash — админ), `status`, `source`, `photo_path`, `rejection_reason`, `created_at`, `updated_at`.

#### API

- `GET /api/expenses` — фильтры: `from`, `to`, `driver_id`, `status`
- `POST /api/expenses` — multipart (фото для водителя)
- `PATCH /api/expenses/:id/review` — approve/reject (admin)
- `DELETE /api/expenses/:id`

**Экран:** `ExpensesScreen` (отдельная вкладка у admin, у водителя — через «Финансы» / «Ещё»).

### 4.4 Заработок водителя (`/api/earnings/summary`)

Параметры: `from`, `to`, `driver_id` (admin).

| Поле | Формула |
|------|---------|
| `total_trips` | Кол-во завершённых рейсов за период |
| `total_volume` | Сумма объёмов рейсов |
| `estimated_income` | SUM(`driver_rate`) по завершённым рейсам |
| `compensations` | SUM одобренных личных расходов (`source=driver`, `status=approved`) |
| `expenses_pending` / `approved` / `rejected` | Разбивка личных расходов |
| **`total_earnings`** | **`estimated_income + compensations`** |
| `actual_income` / `actual_expense` | Из таблицы `finances` (ручные операции) |

**Экран:** `EarningsScreen`.

### 4.5 Зарплата (`/api/salary`)

Таблица `driver_payments`, типы: `salary`, `advance`, `bonus`, `deduction`.

Поля выплаты: `amount`, `note`, `method`, `period_start`, `period_end`.

**`/api/salary/summary`** (по водителю и периоду):

```
gross_trips   = SUM(driver_rate) по завершённым рейсам
compensations = SUM одобренных личных расходов водителя
gross         = gross_trips + compensations
deducted      = SUM выплат type='deduction' за период
paid          = SUM выплат type IN ('salary','advance','bonus')
debt          = gross + deducted - paid
```

**`/api/salary/debts`** — сводка долгов по всем водителям (без фильтра периода).

**Экран:** `SalaryScreen`.

### 4.6 Финансовые операции (`finances`)

Ручные доходы/расходы по водителю: `type` = `income` | `expense`, привязка к заказу опциональна.

**Экраны:** `AdminFinancesScreen`, `DriverFinancesScreen` (read-only у водителя), `FinancesScreen` (hub).

### 4.7 Контрагенты и долги

**Контрагенты** (`contractors`): заказчики/поставщики, тип, телефон, адрес.

**Долг контрагента** (`/api/contractors/summary`):

```
accrued = SUM(volume × company_rate) по завершённым рейсам заказов контрагента
paid    = SUM(contractor_payments.amount)
debt    = accrued - paid
```

**Экраны:** `ContractorsScreen`, `ContractorDebtScreen`.

### 4.8 Финансовые отчёты (`/api/reports`)

**`/api/reports/daily`** — по дням за период:

```
revenue     = SUM(volume × company_rate)   // выручка
driver_pay  = SUM(driver_rate)               // начислено водителям
expenses    = SUM(expenses.amount) WHERE status IS NULL OR status='approved'
costs       = driver_pay + expenses
profit      = revenue - costs
```

**`/api/reports/summary`** — итоги за период (те же метрики).

В финотчёт попадают только **одобренные** расходы (и legacy-записи без `status`).

**Экраны:** `FinanceReportScreen`, `ReportsScreen`, `AdminHomeScreen` (KPI-дашборд через `/api/dashboard`).

### 4.9 Excel-экспорт (`/api/export/*`)

| Endpoint | Содержимое |
|----------|------------|
| `/registry` | Реестр рейсов |
| `/financial-report` | Финотчёт (3 листа) |
| `/expenses` | Расходы |
| `/earnings` | Заработок |
| `/salary` | Зарплатный табель |
| `/finances` | Финансовые операции |

### 4.10 Документы и фото

- Путевые листы — `WaybillsScreen`
- Счета — `InvoicesScreen`
- Документы по заказам — `DocumentsScreen`
- Шаблоны документов — `TemplatesScreen`
- Галерея ТТН — `AllPhotosScreen`, `TripPhotosScreen`
- Фото хранятся на сервере в `uploads/trips`, `uploads/expenses`

### 4.11 Администрирование

- Заявки на регистрацию — `AdminRegistrationRequestsScreen`
- Уведомления — `NotificationsScreen`
- Журнал действий — `ActivityLogScreen`
- Резервные копии (ZIP: БД + uploads) — `BackupsScreen`
- Настройки URL сервера — `ServerSetupScreen`
- OTA-обновления — из `AdminMoreScreen` (только production; experimental — OTA выключен)

### 4.12 Справочники

- Водители — `DriversScreen`
- Автомобили — `VehiclesScreen`
- Материалы — `MaterialsScreen`
- Шаблоны заказов — `OrderTemplatesScreen`

---

## 5. База данных (PostgreSQL)

### Основные таблицы

| Таблица | Назначение |
|---------|------------|
| `users` | email, password_hash, role, full_name, phone, is_owner |
| `drivers` | user_id, car_number, license, is_active |
| `contractors` | контрагенты |
| `orders` | заказы со ставками и адресами |
| `trips` | рейсы: stage, status, volume, ttn_number, photo_path, completed_at |
| `expenses` | расходы + status, source, photo_path, rejection_reason |
| `driver_payments` | зарплата/аванс/премия/удержание |
| `finances` | ручные income/expense по водителю |
| `contractor_payments` | оплаты от контрагентов |
| `materials`, `vehicles` | справочники |
| `waybills`, `invoices`, `documents` | документооборот |
| `order_templates`, `document_templates` | шаблоны |
| `notifications`, `activity_log` | уведомления и аудит |
| `admin_registration_requests`, `driver_registration_requests` | заявки |
| `fuel_cards`, `fuel_transactions`, `fuel_settings`, `fuel_sync_logs` | топливо Opti (интеграция) |

### Ключевая таблица `expenses` (миграции)

```sql
status TEXT DEFAULT 'approved'          -- pending | approved | rejected
source TEXT DEFAULT 'admin'             -- driver | admin | system
photo_path TEXT
rejection_reason TEXT
updated_at TEXT
```

Старые записи без `status`/`source` трактуются как `approved` / `admin`.

---

## 6. Сводка формул расчётов

```
Завершённый рейс:
  status='completed' OR (status IS NULL AND stage='unloading')

Начисление водителю за рейс = orders.driver_rate (фикс, не × объём)

Выручка за рейс = trips.volume × orders.company_rate

compensations(driver, period) =
  SUM(expenses.amount)
  WHERE source='driver' AND status='approved'
  AND exp_date IN [from, to]

total_earnings = estimated_income + compensations

salary.gross = trip_accrued + compensations
salary.debt  = gross + deductions − paid(salary+advance+bonus)

Финотчёт:
  expenses = SUM WHERE status IS NULL OR status='approved'
  costs    = driver_pay + expenses
  profit   = revenue − costs

Долг контрагента = accrued(рейсы) − paid(оплаты)
```

Дата рейса для отчётов: `COALESCE(trips.completed_at, trips.created_at)`.

Дата расхода: `expenses.exp_date`.

---

## 7. API-модули (все под `/api`)

`auth`, `health`, `dashboard`, `drivers`, `orders`, `trips`, `expenses`, `earnings`, `salary`, `finances`, `contractors` (+ `/payments`, `/summary`), `reports`, `export`, `photos`, `documents`, `templates`, `order-templates`, `materials`, `vehicles`, `waybills`, `invoices`, `notifications`, `activity`, `backups`, `admin-registrations`, `driver-registrations`.

- Авторизация: `Authorization: Bearer <JWT>`
- Загрузка фото: multipart на `/trips`, `/expenses`
- Пагинация и кэш: есть на ряде list-эндпоинтов

---

## 8. Дизайн-система (это можно менять)

### Токены (`src/theme/colors.ts`)

```ts
bg: '#1E1E1E'
surface: '#2C2C2C'
surfaceElevated: '#333333'
primary: '#1A73E8'
profit: '#00C853'      // одобрено, прибыль
loss: '#FF1744'        // отклонено, убыток
warning: '#FB8C00'     // pending
text: '#FFFFFF'
textMuted: '#B0B0B0'
tabBar: '#1A1A1A'
```

Также: `src/theme/spacing.ts`, `src/styles/screenUi.ts`, `src/components/ui-kit/`.

### Статусы расходов (цвета)

- `pending` → warning (оранжевый)
- `approved` → profit (зелёный)
- `rejected` → loss (красный)

### Известные проблемы UI (цель редизайна)

Часть экранов (`OrderDetailScreen`, `DriverOrdersScreen` и др.) используют **hardcoded light hex** вместо `colors.*` — при редизайне унифицировать через тему.

Референс визуала (не production): `design/v0-reference/`.

### Ключевые UI-компоненты для стилизации

```
src/components/CustomBottomTabBar.tsx
src/components/ScreenHeader.tsx
src/components/ScreenHero.tsx
src/components/expenses/*  (карточки, модалки, фильтры)
src/screens/*.tsx          (только разметка и StyleSheet)
```

---

## 9. Ограничения (обязательно соблюдать)

1. Рабочая папка: **`C:\work\mobile-experimental`** только.
2. **Не трогать** `C:\work\mobile` (production v1.2.3).
3. **Не менять** `RootNavigator.tsx`, `src/api/*`, `src/auth/*`, бизнес-логику экранов.
4. **Не использовать** `@react-navigation/bottom-tabs`.
5. **Не менять** сервер и API-контракты.
6. Можно менять: тему, ui-kit, стили экранов, типографику, отступы, empty/loading/error states, анимации.
7. Все подписи UI — **на русском**.

---

## 10. Типичные пользовательские сценарии

### Водитель

1. Входит → видит свои активные заказы.
2. На заказе: погрузка → разгрузка с ТТН и фото.
3. Добавляет личный расход (ДПС, дорога…) с фото → статус «На проверке».
4. Смотрит заработок: рейсы + одобренные компенсации.
5. Смотрит документы и финансы (read-only).

### Администратор

1. Создаёт заказ, назначает водителя и ставки.
2. Модерирует расходы водителей (одобрить/отклонить с причиной).
3. Вносит операционные расходы компании (16 категорий).
4. Ведёт зарплатные выплаты и смотрит долги водителям.
5. Контролирует долги контрагентов.
6. Строит финотчёт за период, выгружает Excel.
7. Смотрит реестр рейсов, фото ТТН, дашборд KPI.

---

## 11. Деплой и инфраструктура (справочно)

- Backend: Timeweb App **ReestrPro Backend** (ID 211901, endpoint `26b3`)
- БД: PostgreSQL Timeweb «реестр»
- Production APK: EAS build v1.2.3, OTA включён
- Experimental APK: отдельный package, OTA выключен, бейдж «ЭКСПЕРИМЕНТАЛЬНАЯ СБОРКА» на Login

---

## Стартовая команда для дизайн-чата

> Работай только в `C:\work\mobile-experimental`. Меняй дизайн и стили. Не трогай логику, API, auth и `RootNavigator.tsx`. Унифицируй тёмную тему через `src/theme/colors.ts`. Контекст проекта: `docs/PROJECT-CONTEXT.md`.
