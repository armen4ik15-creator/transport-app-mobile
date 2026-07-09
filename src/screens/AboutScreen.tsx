import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { ScreenHeader } from '../components/ScreenHeader';
import { MenuButton } from '../components/ui';
import { getServerUrl } from '../api/client';
import { checkAndApplyUpdate, getCurrentUpdateLabel } from '../utils/appUpdate';
import { getAppVersion, getOtaRuntimeVersion } from '../utils/appVersion';
import { screenUi } from '../styles/screenUi';
import { colors, spacing } from '../theme';

export function AboutScreen() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [reloading, setReloading] = useState(false);

  const appVersion = getAppVersion();
  const runtimeVersion = getOtaRuntimeVersion();
  const updateLabel = getCurrentUpdateLabel();

  const loadServerUrl = useCallback(async () => {
    const base = await getServerUrl();
    setServerUrl(base);
    if (!base) return;
    try {
      const response = await fetch(`${base}/public/app-release`);
      if (!response.ok) return;
      const data = (await response.json()) as { apk_available?: boolean; download_path?: string | null };
      if (data.apk_available && data.download_path) {
        setApkUrl(`${base.replace(/\/api$/, '')}${data.download_path}`);
      }
    } catch {
      setApkUrl(null);
    }
  }, []);

  useEffect(() => {
    void loadServerUrl();
  }, [loadServerUrl]);

  const onCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      await checkAndApplyUpdate(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const onReloadApp = async () => {
    if (__DEV__) {
      Alert.alert('Перезапуск', 'В режиме разработки перезапуск через OTA недоступен.');
      return;
    }
    if (!Updates.isEnabled) {
      Alert.alert('Перезапуск', 'OTA выключен в этой сборке. Переустановите APK.');
      return;
    }
    setReloading(true);
    try {
      await Updates.reloadAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось перезапустить приложение';
      Alert.alert('Ошибка', message);
    } finally {
      setReloading(false);
    }
  };

  const onDownloadApk = async () => {
    const url = apkUrl ?? (serverUrl ? `${serverUrl.replace(/\/api$/, '')}/downloads/reestrpro.apk` : null);
    if (!url) {
      Alert.alert('APK', 'Ссылка на APK пока недоступна. Обратитесь к администратору.');
      return;
    }
    const opened = await Linking.openURL(url);
    if (!opened) {
      Alert.alert('APK', `Откройте в браузере:\n${url}`);
    }
  };

  return (
    <ScrollView style={screenUi.container} contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}>
      <ScreenHeader title="О приложении" />

      <View style={[screenUi.card, { marginBottom: spacing.md }]}>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Версия приложения</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{appVersion}</Text>

        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 }}>
          Runtime (OTA)
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{runtimeVersion}</Text>

        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 }}>
          Текущее OTA-обновление
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{updateLabel}</Text>

        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 }}>
          Сервер API
        </Text>
        <Text style={{ fontSize: 14, color: colors.primaryLight }} selectable>
          {serverUrl ?? 'Загрузка…'}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <MenuButton
          label={checkingUpdate ? 'Проверка…' : 'Проверить обновления'}
          onPress={() => {
            if (!checkingUpdate) void onCheckUpdates();
          }}
        />
        <MenuButton
          label={reloading ? 'Перезапуск…' : 'Перезапустить приложение'}
          onPress={() => {
            if (!reloading) void onReloadApp();
          }}
          variant="secondary"
        />
        <MenuButton
          label="Скачать APK с сервера (без Expo)"
          onPress={() => void onDownloadApk()}
          variant="secondary"
        />
      </View>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 }}>
        Если OTA пишет «Failed to download» — Expo/Google недоступны из вашей сети. Скачайте APK с сервера
        Timeweb или через USB с компьютера.
      </Text>
    </ScrollView>
  );
}
