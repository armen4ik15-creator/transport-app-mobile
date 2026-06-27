import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import axios from 'axios';
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
  clearServerUrl,
} from '../api/client';
import {
  getCurrentProductionHost,
  isDeprecatedServerHost,
} from '../constants/deprecatedServers';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';

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
    if (!/^\d+$/.test(cleanPort)) {
      setError('Порт должен быть числом');
      return;
    }

    setBusy(true);
    setError(null);
    const apiUrl = buildApiUrl(cleanIp, cleanPort);

    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await axios.get(`${apiUrl}/health/live`, { timeout: 25000 });
        const status = response.data?.status;
        if (status !== 'ok' && status !== 'degraded') {
          throw new Error('Некорректный ответ health');
        }
        await setServerUrl(apiUrl);
        setIp(cleanIp);
        setPort(cleanPort);
        onConfigured?.();
        Alert.alert('Подключение успешно', `Сервер сохранён:\n${apiUrl.replace(/\/api\/?$/, '')}`);
        setBusy(false);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
        }
      }
    }

    await clearServerUrl();
    setError('Не удалось подключиться к серверу');
    const detail =
      axios.isAxiosError(lastError) && lastError.code === 'ECONNABORTED'
        ? 'Сервер не ответил вовремя. Попробуйте мобильный интернет без VPN или повторите через минуту.'
        : 'Проверьте адрес, порт 443 и интернет.';
    Alert.alert('Ошибка', `Не удалось подключиться к серверу.\n\n${detail}`);
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
          />
          <Field label="Порт" value={port} onChangeText={setPort} keyboardType="number-pad" placeholder="443" />
          <ErrorText message={error} />
          <PrimaryButton
            label="🔗 Подключиться"
            onPress={() => {
              void onConnect();
            }}
            loading={busy}
          />
          <MenuButton
            label="☁️ Использовать продакшен-сервер"
            onPress={() => {
              void onConnect(DEFAULT_PRODUCTION_HOST, DEFAULT_PRODUCTION_PORT);
            }}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
}
