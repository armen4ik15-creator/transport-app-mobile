# Figma — продолжение с места остановки

> **Emergent** (`app.emergent.sh`) — отдельный эксперимент, **не** источник для Figma.  
> **Figma:** https://www.figma.com/design/xnJgIHyde1Xip5kzI3i0zm/Untitled

## Уже сделано в Figma

| Элемент | Статус |
|---------|--------|
| Коллекция переменных `ReestrPro Tokens` | ✅ 8 цветов (Dark mode) |
| `02 Login` | ✅ |
| `03 Dashboard Admin` | ✅ |
| `04 Expenses List` | ❌ лимит MCP |
| `05 Add Expense` | ❌ |
| `06 Reports` | ❌ |
| `07 Contractor Payments` | ❌ |
| `08 Settings` | ❌ |
| Opti / Fuel экраны | ❌ не делаем (отложено) |

## Смена цветовой гаммы (без перерисовки)

Все **новые** экраны привязываются к переменным:

| Variable | Сейчас | Назначение |
|----------|--------|------------|
| `color/bg` | `#121212` | Фон экрана |
| `color/surface` | `#1E1E1E` | Карточки |
| `color/surface-elevated` | `#2C2C2C` | Чипы, строки |
| `color/primary` | `#1A73E8` | Кнопки, акцент |
| `color/profit` | `#00C853` | Плюс |
| `color/loss` | `#FF1744` | Минус |
| `color/text-primary` | `#FFFFFF` | Заголовки |
| `color/text-secondary` | `#B0B0B0` | Подписи |

**Как поменять тему в Figma вручную:**
1. Откройте файл → панель **Local variables** (иконка ромба)
2. Коллекция **ReestrPro Tokens** → mode **Dark**
3. Меняйте значения — все привязанные элементы обновятся

**Варианты для эксперимента** (скопируйте в variables):

| Стиль | bg | surface | primary |
|-------|-----|---------|---------|
| Текущий тёмный | #121212 | #1E1E1E | #1A73E8 |
| Синий корпоративный | #0D1117 | #161B22 | #2563EB |
| Светлый (позже) | #F5F5F5 | #FFFFFF | #1A73E8 |

## Осталось сделать (1 вызов MCP)

Когда лимит Figma MCP сбросится — напишите в Cursor: **«запусти FIGMA batch»**.

Один скрипт создаст экраны 04–08 с привязкой к variables (экономия лимита).

## Ручное продолжение (если лимит не сбросился)

1. Дублируйте `03 Dashboard Admin` → переименуйте в `04 Expenses List`
2. Замените контент по брифу: `FIGMA-DESIGN-BRIEF.md`
3. Для цветов: выделите фрейм → Fill → **Apply variable** → `color/surface`

## Связь с APK

После утверждения макета в Figma → перенос в `C:\work\mobile\src\theme\` → сборка APK.
