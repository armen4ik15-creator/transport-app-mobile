# Точка восстановления — production mobile

**Не менять production без необходимости.** Эксперименты — только в `C:\work\mobile-experimental`.

## Зафиксированная версия (установлена на телефоне)

| Параметр | Значение |
|----------|----------|
| Версия | **1.2.3** (versionCode 23) |
| Git tag | `restore-point/v1.2.3-installed` |
| Commit | `b80e3b3` |
| Package | `com.reestrpro.mobile` |
| OTA channel | `production` |
| Сервер | `armen4ik15-creator-transport-app-server-26b3.twc1.net` |

## APK

https://expo.dev/artifacts/eas/GB6O_oZZ60k1TAGhGMnbqs6I5x0kC5pcNVs3HTwRmaQ.apk

## Откат production-кода

```bash
cd C:\work\mobile
git checkout main
git reset --hard restore-point/v1.2.3-installed
```

## Экспериментальная копия

Путь: `C:\work\mobile-experimental`  
Ветка: `experimental`  
Package: `com.reestrpro.experimental` — ставится **рядом** с production APK.
