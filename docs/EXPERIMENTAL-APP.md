# ReestrPro Экспериментальный

Полная копия приложения для **дизайна и UI**. Production не затрагивается.

## Отличия от production

| | Production | Экспериментальный |
|---|------------|-------------------|
| Папка | `C:\work\mobile` | `C:\work\mobile-experimental` |
| Ветка | `main` | `experimental` |
| Имя на телефоне | ReestrPro | **ReestrPro Экспериментальный** |
| Package | `com.reestrpro.mobile` | `com.reestrpro.experimental` |
| OTA | production | выключен |

## Запуск на ПК

```bash
cd C:\work\mobile-experimental
npm install
npx expo start
```

В Expo Go отсканируйте QR — это **рабочее приложение** с API, не зависит от v0 preview.

## Превью дизайна v0 в браузере (если v0.dev завис)

Макет из v0 лежит в `design/v0-reference/`. Локальный запуск:

```bash
npm run design:preview
```

Откройте http://localhost:3000 — кликабельный прототип admin/driver без бэкенда.

## APK на телефон

```bash
npm install
npx eas build --platform android --profile experimental
```

Ссылку на APK пришлёт EAS после сборки. Или локально: `npx expo run:android` (нужен Android SDK).

## Дизайн v0 → это приложение

Токены (`#1E1E1E` фон, `#2C2C2C` карточки, `#1A73E8` primary) синхронизированы из `design/v0-reference/app/globals.css` в `src/theme/`. Экран входа и все экраны используют RN-код в `src/` — его и ставьте на телефон для теста.

## Правила

1. Все изменения дизайна — **только здесь**
2. В `C:\work\mobile` (main) — только осознанный перенос готового результата
3. Оба приложения можно держать установленными одновременно
