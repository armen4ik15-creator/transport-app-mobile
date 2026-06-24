import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { V0IconField } from '../components/v0';
import { ErrorText, PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const COMPANY_NAME = 'ООО «РеестрПро»';

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
          paddingHorizontal: spacing.lg,
          paddingTop: 56,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
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
            <Text style={{ fontSize: 30 }}>🚛</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.md }}>
            ReestrPro
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{COMPANY_NAME}</Text>
          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radii.full,
              backgroundColor: colors.warningMuted,
              borderWidth: 1,
              borderColor: `${colors.warning}88`,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.warning }}>
              ЭКСПЕРИМЕНТАЛЬНАЯ СБОРКА
            </Text>
          </View>
        </View>

        <V0IconField
          icon="✉️"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <V0IconField
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          secureTextEntry
        />
        <ErrorText message={error} />
        <PrimaryButton label="Войти" onPress={onSubmit} loading={loading} disabled={!email || !password} />

        <Pressable
          onPress={() =>
            navigation.navigate('ServerSetup', {
              reason: 'Измените адрес сервера и попробуйте снова.',
            })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>🖥️</Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textMuted }}>Настройки сервера</Text>
        </Pressable>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.secondary,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontSize: 16 }}>👤</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Регистрация водителя</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 13, color: colors.primaryLight }}>Забыли пароль?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
