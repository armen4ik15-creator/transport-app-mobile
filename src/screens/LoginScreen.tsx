import { useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ErrorText,
  Field,
  MenuButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('admin123');
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
    <Screen>
      <Title>РеестрПро</Title>
      <Subtitle>Войдите в свой аккаунт</Subtitle>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="admin@test.com"
      />
      <Field
        label="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="admin123"
      />
      <ErrorText message={error} />
      <PrimaryButton label="Войти" onPress={onSubmit} loading={loading} />
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
    </Screen>
  );
}
