import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, PrimaryButton } from '../components/ui';
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
  SERVER_URL_KEY,
} from '../api/client';
import type { RootStackParamList } from '../navigation/RootNavigator';
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

  const onConnect = async () => {
    const cleanIp = ip.trim();
    const cleanPort = port.trim() || DEFAULT_PRODUCTION_PORT;

    if (!cleanIp) {
      setError('Введите IP-адрес сервера');
      return;
    }
    if (!/^\d+$/.test(cleanPort)) {
      setError('Порт должен быть числом');
      return;
    }

    setBusy(true);
    setError(null);
    const apiUrl = buildApiUrl(cleanIp, cleanPort);

    try {
      const response = await axios.get(`${apiUrl}/health`, { timeout: 15000 });
      if (response.data?.status !== 'ok') {
        throw new Error('Некорректный ответ health');
      }
      await setServerUrl(apiUrl);
      onConfigured?.();
      Alert.alert('Подключение успешно', `Сервер сохранён в ${SERVER_URL_KEY}`);
    } catch {
      await clearServerUrl();
      setError('Не удалось подключиться к серверу');
      Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
    } finally {
      setBusy(false);
    }
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
          <PrimaryButton label="🔗 Подключиться" onPress={onConnect} loading={busy} />
        </View>
      </ScrollView>
    </View>
  );
}
