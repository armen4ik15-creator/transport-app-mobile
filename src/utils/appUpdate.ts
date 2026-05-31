import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function getCurrentUpdateLabel(): string {
  if (__DEV__) return 'dev';
  if (!Updates.isEnabled) return 'OTA выключен';
  return Updates.updateId?.slice(0, 8) ?? 'embedded';
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
        'Установленная сборка не поддерживает OTA. Нужен новый APK из EAS Build (production).'
      );
    }
    return;
  }

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      if (manual) {
        Alert.alert('Обновления', `У вас последняя версия.\nID: ${getCurrentUpdateLabel()}`);
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
      Alert.alert('Ошибка OTA', `${message}\n\nПопробуйте переустановить APK или сменить сеть.`);
    }
  }
}
