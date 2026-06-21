# ReestrPro — план редизайна UI без смены функционала

> **Принцип:** меняем только внешний вид и UX-подачу. API, навигация, бизнес-логика, экраны — **те же**.

## Источники дизайна

| Источник | Роль |
|----------|------|
| **Действующее приложение** `C:\work\mobile` | Истина по функциям |
| **v0** (Transportation app UI / ОптиУчёт) | Референс визуала, не копировать 1:1 |
| **Figma** `xnJgIHyde1Xip5kzI3i0zm` | Токены цветов, макеты |
| **Emergent** | Только память, не переносим |

## Что НЕ трогаем

- `src/api/*` — запросы к серверу
- `src/auth/*` — сессия, JWT
- `src/navigation/types.ts` — маршруты и параметры
- Логика экранов (hooks, handlers, validation)
- Opti / fuel cards — отложено

## Что меняем

- `src/theme/` — цвета, отступы, радиусы, типографика
- `src/components/ui/` — Button, Card, Input, Chip, Banner
- Стили экранов — layout, иерархия, пустые состояния
- `CustomBottomTabBar` — иконки, активное состояние
- Тексты-подсказки для информативности (не меняя данных)

---

## Инвентарь приложения (действующий)

### Админ — нижнее меню (8 вкладок)

| Вкладка | Экран | Функция |
|---------|-------|---------|
| 🏠 Главная | AdminHomeScreen | Сводка, быстрые действия |
| 💰 Контраг. | ContractorsScreen | Контрагенты |
| 👤 Водители | DriversScreen | Водители |
| 💸 Расходы | ExpensesScreen | Расходы, фильтры, экспорт |
| 📦 Заказы | OrdersScreen | Заказы |
| 📑 Реестр | RegistryReportScreen | Реестр |
| 💼 Все фин. | AdminFinancesHubScreen | Хаб финансов |
| ⚙️ Компания | AdminMoreScreen | Настройки, справочники |

### Админ — стек (из любой вкладки)

Заказы, финансы, документы, отчёты, зарплаты, ТТН, фото, материалы, авто, счета, уведомления, журнал и др.

### Водитель — вкладки

Главная, Заказы, Финансы, Ещё + те же стек-экраны в своём scope.

### Auth

Login, Register, ForgotPassword, ServerSetup, CompleteProfile.

---

## Этапы работы

### Этап 1 — Design system в коде (1–2 дня)
- [ ] `src/theme/colors.ts` — светлая + тёмная палитра (переключатель позже)
- [ ] `src/theme/spacing.ts`, `typography.ts`, `radii.ts`
- [ ] `ThemeProvider` + `useTheme()`
- [ ] Компоненты: `Screen`, `Card`, `PrimaryButton`, `TextField`, `StatusBadge`

### Этап 2 — Shell (меню и оболочка)
- [ ] `AdminMainLayout` / `DriverMainLayout` — фон из theme
- [ ] `CustomBottomTabBar` — новый вид (можно сгруппировать 8→4 hub + «Ещё» **без удаления пунктов**)
- [ ] `LoadingScreen`, `NetworkIssueBanner`, `BootstrapErrorScreen`

### Этап 3 — Экраны P0 (видны каждый день)
- [ ] LoginScreen
- [ ] AdminHomeScreen
- [ ] ExpensesScreen (+ CollapsiblePanel уже есть)
- [ ] ContractorDebtScreen / ContractorsScreen
- [ ] ReportsScreen

### Этап 4 — Экраны P1
- [ ] Orders, Drivers, Finances hub, AdminMore
- [ ] Driver home + expenses

### Этап 5 — Остальные + APK
- [ ] Полировка, пустые состояния, иконки
- [ ] Сборка release APK

---

## Как использовать v0

1. v0 **не открывает** ваш APK — референс по промпту + скринам **нашего** приложения
2. Вы присылаете скрины текущих экранов → v0 рисует «как могло бы быть»
3. Я переношу **только стили** в `C:\work\mobile`

Промпт для v0:
```
Redesign only — same features as ReestrPro transport app.
8 admin tabs must remain accessible (home, contractors, drivers, expenses, orders, registry, finances hub, company settings).
Russian UI. Do not add Opti API. Match screenshot layout but improve hierarchy and readability.
```

---

## Критерий готовности

- [ ] Все старые пункты меню доступны
- [ ] Все API-вызовы работают как до редизайна
- [ ] Единая палитра, меняется из `theme/colors.ts`
- [ ] APK собирается, smoke-test проходит
