import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { getOtaRuntimeVersion } from './appVersion';

export function getCurrentUpdateLabel(): string {
  if (__DEV__) return 'dev';
  if (!Updates.isEnabled) return 'embedded (OTA выкл)';
  return Updates.updateId?.slice(0, 8) ?? 'embedded';
}

function buildUpdateDiagnostics(): string {
  return [
    `OTA: ${Updates.isEnabled ? 'включён' : 'ВЫКЛЮЧЕН — нужен новый APK'}`,
    `Runtime: ${getOtaRuntimeVersion()}`,
    `Текущий bundle: ${getCurrentUpdateLabel()}`,
    `Канал: production`,
  ].join('\n');
}

export async function checkAndApplyUpdate(manual = false): Promise<void> {
  if (__DEV__) {
    if (manual) Alert.alert('Обновления', 'В режиме разработки OTA недоступен.');
    return;
  }

  if (!Updates.isEnabled) {
    if (manual) {
      Alert.alert(
        'Обновления недоступны',
        `${buildUpdateDiagnostics()}\n\nУстановите новый APK из EAS Build (production).`
      );
    }
    return;
  }

  try {
    const result = await Updates.checkForUpdateAsync();

    if (!result.isAvailable) {
      if (manual) {
        Alert.alert(
          'Обновления',
          `${buildUpdateDiagnostics()}\n\nНа сервере нет более новой версии для этого runtime.`
        );
      }
      return;
    }

    if (manual) {
      Alert.alert('Обновление', 'Найдено обновление, загружаем…');
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось проверить обновление';
    if (manual) {
      Alert.alert('Ошибка OTA', `${message}\n\n${buildUpdateDiagnostics()}`);
    }
  }
}
