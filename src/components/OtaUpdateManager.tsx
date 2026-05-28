import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export function OtaUpdateManager() {
  useEffect(() => {
    async function checkForOtaUpdate() {
      try {
        if (__DEV__ || !Updates.isEnabled) return;

        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // OTA недоступен без сети или на dev-сборке — не блокируем запуск
      }
    }

    void checkForOtaUpdate();
  }, []);

  return null;
}
