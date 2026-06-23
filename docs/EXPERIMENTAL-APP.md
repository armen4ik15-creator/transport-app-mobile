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

## APK на телефон

```bash
npx eas build --platform android --profile experimental
```

Или локально: `npx expo run:android` (нужен Android SDK).

## Правила

1. Все изменения дизайна — **только здесь**
2. В `C:\work\mobile` (main) — только осознанный перенос готового результата
3. Оба приложения можно держать установленными одновременно
