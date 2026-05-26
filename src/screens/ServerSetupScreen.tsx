import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, ErrorText, Field, PrimaryButton, Screen, Subtitle, Title } from '../components/ui';
import {
  getServerUrl,
  setServerUrl,
  clearServerUrl,
  SERVER_URL_KEY,
} from '../api/client';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerSetup'>;
type ComponentProps = Props & { onConfigured?: () => void };

function parseSavedAddress(url: string): { ip: string; port: string } {
  const withoutApi = url.replace(/\/api\/?$/, '');
  const match = withoutApi.match(/^https?:\/\/([^:/]+)(?::(\d+))?$/i);
  if (!match) return { ip: '', port: '3000' };
  return { ip: match[1], port: match[2] || '3000' };
}

export function ServerSetupScreen({ route, onConfigured }: ComponentProps) {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('3000');
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
    const cleanPort = port.trim() || '3000';

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
    const apiUrl = `http://${cleanIp}:${cleanPort}/api`;

    try {
      const response = await axios.get(`${apiUrl}/health`, { timeout: 6000 });
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
    <Screen>
      <Title>Настройка сервера</Title>
      <Subtitle>{reasonText}</Subtitle>
      <Card>
        <Field
          label="IP-адрес сервера"
          value={ip}
          onChangeText={setIp}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="192.168.1.33"
        />
        <Field
          label="Порт"
          value={port}
          onChangeText={setPort}
          keyboardType="number-pad"
          placeholder="3000"
        />
        <ErrorText message={error} />
        <PrimaryButton label="Подключиться" onPress={onConnect} loading={busy} />
      </Card>
    </Screen>
  );
}
