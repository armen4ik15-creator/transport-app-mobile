import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, MenuButton, PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось войти');
      setError(msg);
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: spacing.lg,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radii.lg,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ fontSize: 36 }}>🚛</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>ReestrPro</Text>
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radii.sm,
              backgroundColor: `${colors.warning}33`,
              borderWidth: 1,
              borderColor: colors.warning,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning }}>ЭКСПЕРИМЕНТАЛЬНАЯ СБОРКА</Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            Управление перевозками и автопарком
          </Text>
        </View>

        <Field
          label="Эл. почта"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email@company.ru"
        />
        <Field
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <ErrorText message={error} />
        <PrimaryButton label="Войти" onPress={onSubmit} loading={loading} />
        <MenuButton
          label="Забыли пароль?"
          onPress={() => navigation.navigate('ForgotPassword')}
          variant="secondary"
        />
        <MenuButton
          label="Регистрация водителя"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
        />
        <MenuButton
          label="Настройки сервера"
          onPress={() =>
            navigation.navigate('ServerSetup', {
              reason: 'Измените адрес сервера и попробуйте снова.',
            })
          }
          variant="secondary"
        />
        <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }}>
          Защищённое соединение · сессия сохраняется автоматически
        </Text>
      </ScrollView>
    </View>
  );
}
