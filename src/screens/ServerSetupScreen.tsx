import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, MenuButton, PrimaryButton } from '../components/ui';
import { ScreenHero } from '../components/ScreenHero';
import {
  DEFAULT_PRODUCTION_HOST,
  DEFAULT_PRODUCTION_PORT,
} from '../constants/config';
import {
  buildApiUrl,
  getServerUrl,
  setServerUrl,
} from '../api/client';
import {
  getCurrentProductionHost,
  isDeprecatedServerHost,
} from '../constants/deprecatedServers';
import { isProductionHost, probeServerHealthWithRetry } from '../utils/serverHealth';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerSetup'>;
type ComponentProps = Props & { onConfigured?: () => void };

function parseSavedAddress(url: string): { ip: string; port: string } {
  const withoutApi = url.replace(/\/api\/?$/, '');
  const match = withoutApi.match(/^https?:\/\/([^:/]+)(?::(\d+))?$/i);
  if (!match) return { ip: DEFAULT_PRODUCTION_HOST, port: DEFAULT_PRODUCTION_PORT };
  return { ip: match[1], port: match[2] || DEFAULT_PRODUCTION_PORT };
}

export function ServerSetupScreen({ route, onConfigured }: ComponentProps) {
  const [ip, setIp] = useState(DEFAULT_PRODUCTION_HOST);
  const [port, setPort] = useState(DEFAULT_PRODUCTION_PORT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonText = useMemo(
    () => route.params?.reason || 'Укажите адрес сервера, чтобы продолжить.',
    [route.params?.reason]
  );

  useEffect(() => {
    (async () => {
      const saved = await getServerUrl();
      if (!saved) return;
      const parsed = parseSavedAddress(saved);
      setIp(parsed.ip);
      setPort(parsed.port);
    })();
  }, []);

  const onConnect = async (hostOverride?: string, portOverride?: string) => {
    const cleanIp = (hostOverride ?? ip).trim();
    const cleanPort = (portOverride ?? port).trim() || DEFAULT_PRODUCTION_PORT;

    if (!cleanIp) {
      setError('Введите IP-адрес сервера');
      return;
    }
    if (isDeprecatedServerHost(cleanIp)) {
      setIp(getCurrentProductionHost());
      setPort(DEFAULT_PRODUCTION_PORT);
      setError('Этот сервер устарел. Нажмите «Подключиться» ещё раз — подставлен актуальный адрес.');
      return;
    }
    if (!cleanIp.includes('.twc1.net') && !/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanIp)) {
      setError('Адрес обрезан или неверный. Скопируйте полный домен из подсказки ниже.');
      return;
    }
    if (!/^\d+$/.test(cleanPort)) {
      setError('Порт должен быть числом');
      return;
    }

    setBusy(true);
    setError(null);
    setIp(cleanIp);
    setPort(cleanPort);

    const apiUrl = buildApiUrl(cleanIp, cleanPort);
    const ok = await probeServerHealthWithRetry(apiUrl, 3, 25000);

    if (ok) {
      await setServerUrl(apiUrl);
      onConfigured?.();
      Alert.alert('Подключение успешно', `Сервер сохранён:\n${apiUrl.replace(/\/api\/?$/, '')}`);
      setBusy(false);
      return;
    }

    if (isProductionHost(cleanIp)) {
      await setServerUrl(apiUrl);
      onConfigured?.();
      Alert.alert(
        'Сервер сохранён',
        'Проверка связи не прошла, но сохранён продакшен-сервер. На экране входа нажмите «Проверить подключение» или войдите снова.'
      );
      setBusy(false);
      return;
    }

    setError('Не удалось подключиться к серверу');
    Alert.alert(
      'Ошибка',
      'Не удалось подключиться к серверу.\n\nПроверьте адрес, порт 443, интернет и отключите VPN.'
    );
    setBusy(false);
  };

  return (
    <View style={screenUi.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[screenUi.card, { padding: 24, borderRadius: 16 }]}>
          <ScreenHero title="⚙️ Настройка сервера" subtitle={reasonText} />
          <Field
            label="Адрес сервера (IP или домен)"
            value={ip}
            onChangeText={setIp}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={DEFAULT_PRODUCTION_HOST}
            scrollEnabled
            selectTextOnFocus
            style={{ fontSize: 13 }}
          />
          <Text
            selectable
            style={{ fontSize: 12, color: colors.textMuted, marginTop: -8, marginBottom: 12, lineHeight: 18 }}
          >
            Полный адрес:{'\n'}
            {DEFAULT_PRODUCTION_HOST}
          </Text>
          <Field label="Порт" value={port} onChangeText={setPort} keyboardType="number-pad" placeholder="443" />
          <ErrorText message={error} />
          <PrimaryButton
            label="🔗 Подключиться"
            onPress={() => {
              void onConnect();
            }}
            loading={busy}
            disabled={busy}
          />
          <MenuButton
            label={busy ? '⏳ Подключение…' : '☁️ Использовать продакшен-сервер'}
            onPress={() => {
              if (busy) return;
              setIp(DEFAULT_PRODUCTION_HOST);
              setPort(DEFAULT_PRODUCTION_PORT);
              void onConnect(DEFAULT_PRODUCTION_HOST, DEFAULT_PRODUCTION_PORT);
            }}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
}
