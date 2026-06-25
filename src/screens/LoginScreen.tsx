import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KitIcon, KitTextField, PrimaryButton } from '../components/kit';
import { ErrorText } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage, getServerUrl, primeApiClientCache, resetAuthTokenCache } from '../api/client';
import { DEFAULT_PRODUCTION_HOST } from '../constants/config';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverLabel, setServerLabel] = useState<string | null>(null);
  const [checkingServer, setCheckingServer] = useState(false);

  useEffect(() => {
    void getServerUrl().then((url) => setServerLabel(url));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void getServerUrl().then((url) => {
        setServerLabel(url);
        if (url) primeApiClientCache(url, null);
      });
    }, [])
  );

  const openServerSetup = () => {
    navigation.navigate('ServerSetup', {
      reason: 'Проверьте адрес сервера. Актуальный: ' + DEFAULT_PRODUCTION_HOST,
    });
  };

  const checkServerConnection = async () => {
    const url = await getServerUrl();
    if (!url) {
      Alert.alert('Сервер не настроен', 'Укажите адрес в настройках сервера.', [
        { text: 'Открыть', onPress: openServerSetup },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    setCheckingServer(true);
    try {
      const [healthRes, loginProbe] = await Promise.all([
        axios.get(`${url}/health/live`, { timeout: 15000 }),
        axios
          .post(`${url}/auth/login`, { email: 'probe@test.local', password: 'probe' }, { timeout: 12000 })
          .catch((err: unknown) => err),
      ]);

      const status = healthRes.data?.status;
      if (status !== 'ok' && status !== 'degraded') {
        throw new Error('unexpected health status');
      }

      const loginTimedOut =
        axios.isAxiosError(loginProbe) &&
        (loginProbe.code === 'ECONNABORTED' || loginProbe.message === 'Network Error') &&
        !loginProbe.response;

      if (loginTimedOut) {
        Alert.alert(
          'Сервер частично недоступен',
          `Health OK, но вход не отвечает (backend завис).\n\n${url.replace(/\/api\/?$/, '')}\n\nПерезапустите ReestrPro Backend на Timeweb (приложение 26b3).`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert('Сервер доступен', `${url.replace(/\/api\/?$/, '')}\n\nВход и health отвечают.`);
    } catch {
      Alert.alert(
        'Сервер недоступен',
        `Телефон не может подключиться к:\n${url}\n\nПроверьте Wi‑Fi/мобильный интернет или укажите сервер:\n${DEFAULT_PRODUCTION_HOST}`,
        [
          { text: 'Настройки сервера', onPress: openServerSetup },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setCheckingServer(false);
    }
  };

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setError(null);
    setLoading(true);
    resetAuthTokenCache();
    try {
      const url = await getServerUrl();
      if (url) primeApiClientCache(url, null);
      await signIn(email.trim().toLowerCase(), password);
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось войти');
      setError(msg);
      const isNetwork = msg.includes('Нет связи с сервером');
      Alert.alert(
        'Ошибка',
        isNetwork
          ? `${msg}\n\nСервер: ${serverLabel ?? 'не задан'}\n\nНажмите «Настройки сервера» и укажите:\n${DEFAULT_PRODUCTION_HOST}`
          : msg,
        isNetwork
          ? [
              { text: 'Настройки сервера', onPress: openServerSetup },
              { text: 'OK', style: 'cancel' },
            ]
          : [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: 56,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', gap: 12, marginBottom: spacing.xl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.lg,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KitIcon name="truck" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>ReestrPro</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
            Управление перевозками и автопарком
          </Text>
        </View>

        <KitTextField
          label="Электронная почта"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.ru"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textMuted, marginBottom: 6 }}>Пароль</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <KitIcon name="lock" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, fontSize: 16, color: colors.text, padding: 0 }}
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
              <KitIcon name={showPassword ? 'eye-off' : 'eye'} />
            </Pressable>
          </View>
        </View>

        <ErrorText message={error} />
        <PrimaryButton label="Войти" onPress={onSubmit} loading={loading} />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.primaryLight }}>Забыли пароль?</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Регистрация водителя</Text>
        </Pressable>

        <Pressable
          onPress={openServerSetup}
          style={{ marginTop: spacing.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          <KitIcon name="globe" size={16} />
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Настройки сервера</Text>
        </Pressable>

        {serverLabel ? (
          <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 8 }} numberOfLines={2}>
            API: {serverLabel.replace(/^https?:\/\//, '')}
          </Text>
        ) : null}

        <Pressable onPress={() => void checkServerConnection()} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.primaryLight }}>
            {checkingServer ? 'Проверка…' : 'Проверить подключение к серверу'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
