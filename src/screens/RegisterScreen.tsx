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

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'driver'>('driver');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Email, пароль и ФИО обязательны');
      return;
    }
    if (password.length < 6) {
      setError('Пароль от 6 символов');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        role,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        license_number: role === 'driver' ? licenseNumber.trim() || undefined : undefined,
        license_expiry: role === 'driver' ? licenseExpiry.trim() || undefined : undefined,
        medical_check_expiry: role === 'driver' ? medicalExpiry.trim() || undefined : undefined,
      });
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось зарегистрироваться');
      setError(msg);
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Регистрация</Title>
      <Subtitle>Создание аккаунта пользователя</Subtitle>
      <MenuButton
        label={role === 'driver' ? '✅ Водитель' : 'Водитель'}
        onPress={() => setRole('driver')}
        variant={role === 'driver' ? 'default' : 'secondary'}
      />
      <MenuButton
        label={role === 'admin' ? '✅ Администратор' : 'Администратор'}
        onPress={() => setRole('admin')}
        variant={role === 'admin' ? 'default' : 'secondary'}
      />
      <Field label="ФИО *" value={fullName} onChangeText={setFullName} />
      <Field
        label="Email *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field label="Пароль * (от 6 символов)" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {role === 'driver' ? (
        <>
          <Field label="Номер водительского удостоверения" value={licenseNumber} onChangeText={setLicenseNumber} />
          <Field label="Срок действия прав (YYYY-MM-DD)" value={licenseExpiry} onChangeText={setLicenseExpiry} />
          <Field
            label="Срок медосмотра (YYYY-MM-DD)"
            value={medicalExpiry}
            onChangeText={setMedicalExpiry}
          />
        </>
      ) : null}
      <ErrorText message={error} />
      <PrimaryButton label="Зарегистрироваться" onPress={onSubmit} loading={loading} />
      <MenuButton label="← Назад ко входу" onPress={() => navigation.goBack()} variant="secondary" />
    </Screen>
  );
}
