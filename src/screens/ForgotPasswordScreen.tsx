import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, MenuButton, PrimaryButton } from '../components/ui';
import { ScreenHero } from '../components/ScreenHero';
import { forgotPassword, getSecurityConfig } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [resetCodeOptional, setResetCodeOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const config = await getSecurityConfig();
        setAvailable(config.password_reset_available);
        setResetCodeOptional(true);
      } catch {
        setAvailable(true);
        setResetCodeOptional(true);
      }
    })();
  }, []);

  const onSubmit = async () => {
    if (!email.trim() || !newPassword) {
      setError('Укажите email и новый пароль');
      return;
    }
    if (!resetCodeOptional && !resetCode.trim()) {
      setError('Введите код восстановления');
      return;
    }
    if (newPassword.length < 6) {
      setError('Пароль от 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await forgotPassword({
        email: email.trim().toLowerCase(),
        reset_code: resetCode.trim() || undefined,
        new_password: newPassword,
      });
      Alert.alert('Готово', result.message, [
        { text: 'Войти', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось сменить пароль');
      setError(msg);
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  const resetCodeLabel = resetCodeOptional
    ? 'Код восстановления (необязательно)'
    : 'Код восстановления *';

  return (
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={[screenUi.card, { padding: 24, borderRadius: 16 }]}>
          <ScreenHero
            title="🔐 Восстановление пароля"
            subtitle="Для одобренных аккаунтов код не нужен — только email и новый пароль"
          />

          {available === false ? (
            <ErrorText message="Сброс пароля не настроен на сервере. Обратитесь к администратору." />
          ) : null}

          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="driver@mail.ru"
          />
          <Field
            label={resetCodeLabel}
            value={resetCode}
            onChangeText={setResetCode}
            autoCapitalize="none"
            placeholder={resetCodeOptional ? 'Только для старых аккаунтов' : 'Код от администратора'}
          />
          <Field
            label="Новый пароль *"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="От 6 символов"
          />
          <Field
            label="Повторите пароль *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <ErrorText message={error} />
          <PrimaryButton label="💾 Сохранить новый пароль" onPress={onSubmit} loading={loading} />
          <MenuButton label="← Назад ко входу" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </ScrollView>
    </View>
  );
}
