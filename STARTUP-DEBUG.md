# Отладка запуска ReestrPro (Android)

## Быстрый сбор логов с устройства

Подключите телефон по USB, включите «Отладка по USB», затем:

```bash
adb devices
adb logcat -c
adb logcat *:E ReactNative:V ReactNativeJS:V AndroidRuntime:E ExpoModules:V
```

Запустите приложение и смотрите строки с `FATAL`, `AndroidRuntime`, `ReactNativeJS`.

Только ошибки (последние 200 строк):

```bash
adb logcat -d -t 200 *:E
```

Фильтр по пакету:

```bash
adb logcat --pid=$(adb shell pidof -s com.reestrpro.mobile)
```

## Лог запуска

С v1.0.4 шаги `[startup]` пишутся только в `adb logcat` (тег `ReactNativeJS`), без `expo-file-system` на старте.

## Типичные причины мгновенного закрытия

1. Несовместимая версия нативного модуля или неполный `prebuild` (манифест ссылается на `@xml/secure_store_*` без ресурсов).
2. Повреждённый OTA-кэш — удалите приложение и установите APK заново.
3. Native crash в Hermes / Expo Modules — `adb logcat AndroidRuntime:E`.

## Сборка release APK локально

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
cd C:\work\mobile\android
.\gradlew assembleRelease
```

APK: `android\app\build\outputs\apk\release\app-release.apk`
