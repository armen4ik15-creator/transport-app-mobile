import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, MenuButton, PrimaryButton } from '../components/ui';
import { ScreenHero } from '../components/ScreenHero';
import { getSecurityConfig, registerAdmin, registerDriver } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type RegisterRole = 'driver' | 'founder';

export function RegisterScreen({ navigation }: Props) {
  const [role, setRole] = useState<RegisterRole>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [driverRegistrationAvailable, setDriverRegistrationAvailable] = useState<boolean | null>(null);
  const [adminRegistrationAvailable, setAdminRegistrationAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const config = await getSecurityConfig();
        setDriverRegistrationAvailable(config.registration_available);
        setAdminRegistrationAvailable(config.admin_registration_available);
      } catch {
        setDriverRegistrationAvailable(false);
        setAdminRegistrationAvailable(true);
      }
    })();
  }, []);

  const isFounder = role === 'founder';
  const registrationBlocked =
    (isFounder && !adminRegistrationAvailable) || (!isFounder && driverRegistrationAvailable === false);

  const onSubmit = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Email, пароль и ФИО обязательны');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (!email.includes('@')) {
      setError('Укажите корректный email (например driver@mail.ru)');
      return;
    }
    if (password.length < 6) {
      setError('Пароль от 6 символов');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isFounder) {
        const result = await registerAdmin({
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        Alert.alert('Заявка отправлена', result.message, [
          { text: 'Ко входу', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }

      const result = await registerDriver({
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        license_expiry: licenseExpiry.trim() || undefined,
        medical_check_expiry: medicalExpiry.trim() || undefined,
      });
      if ('pending' in result && result.pending) {
        Alert.alert('Заявка отправлена', result.message, [
          { text: 'Ко входу', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Готово', 'Аккаунт создан. Войдите с вашим email и паролем.', [
          { text: 'Ко входу', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось зарегистрироваться');
      setError(msg);
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={[screenUi.card, { padding: 24, borderRadius: 16 }]}>
          <ScreenHero
            title="📝 Регистрация"
            subtitle={
              isFounder
                ? 'Заявка учредителя — после одобрения главным администратором'
                : 'Заявка водителя — после одобрения администратором'
            }
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Роль</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <RoleChip label="Водитель" active={!isFounder} onPress={() => setRole('driver')} />
            <RoleChip label="Учредитель" active={isFounder} onPress={() => setRole('founder')} />
          </View>

          {registrationBlocked ? (
            <ErrorText
              message={
                isFounder
                  ? 'Регистрация учредителей временно недоступна.'
                  : 'Самостоятельная регистрация водителей отключена. Попросите администратора создать аккаунт.'
              }
            />
          ) : null}

          <Field label="ФИО *" value={fullName} onChangeText={setFullName} />
          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field label="Пароль * (от 6 символов)" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Повторите пароль *" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          {!isFounder ? (
            <>
              <Field label="Номер водительского удостоверения" value={licenseNumber} onChangeText={setLicenseNumber} />
              <Field label="Срок действия прав (YYYY-MM-DD)" value={licenseExpiry} onChangeText={setLicenseExpiry} />
              <Field label="Срок медосмотра (YYYY-MM-DD)" value={medicalExpiry} onChangeText={setMedicalExpiry} />
            </>
          ) : null}
          <ErrorText message={error} />
          <PrimaryButton
            label={isFounder ? '📨 Отправить заявку' : '📨 Отправить заявку'}
            onPress={onSubmit}
            loading={loading}
            disabled={registrationBlocked}
          />
          <MenuButton label="← Назад ко входу" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </ScrollView>
    </View>
  );
}

function RoleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? '#2563eb' : '#d1d5db',
        backgroundColor: active ? '#eff6ff' : '#fff',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontWeight: '600', color: active ? '#2563eb' : '#6b7280' }}>{label}</Text>
    </Pressable>
  );
}
