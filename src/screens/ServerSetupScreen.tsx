import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, PrimaryButton } from '../components/ui';
import {
  buildApiUrl,
  getServerUrl,
  setServerUrl,
  clearServerUrl,
  SERVER_URL_KEY,
  TOKEN_KEY,
} from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { screenUi } from '../styles/screenUi';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerSetup'>;
type ComponentProps = Props & { onConfigured?: () => void };

function parseSavedAddress(url: string): { ip: string; port: string } {
  const withoutApi = url.replace(/\/api\/?$/, '');
  const match = withoutApi.match(/^https?:\/\/([^:/]+)(?::(\d+))?$/i);
  if (!match) return { ip: '', port: '443' };
  return { ip: match[1], port: match[2] || '443' };
}

export function ServerSetupScreen({ route, onConfigured }: ComponentProps) {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('443');
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
    const cleanPort = port.trim() || '443';

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
      await AsyncStorage.removeItem(TOKEN_KEY);
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
        <View style={[screenUi.card, { padding: 24 }]}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 }}>
            ⚙️ Настройка сервера
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>
            {reasonText}
          </Text>
          <Field
            label="Адрес сервера (IP или домен)"
            value={ip}
            onChangeText={setIp}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="armen4ik15-creator-transport-app-server-43b9.twc1.net"
          />
          <Field label="Порт" value={port} onChangeText={setPort} keyboardType="number-pad" placeholder="443" />
          <ErrorText message={error} />
          <PrimaryButton label="🔗 Подключиться" onPress={onConnect} loading={busy} />
        </View>
      </ScrollView>
    </View>
  );
}
