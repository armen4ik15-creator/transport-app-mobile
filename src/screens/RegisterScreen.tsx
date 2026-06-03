import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorText, Field, MenuButton, PrimaryButton } from '../components/ui';
import { ScreenHero } from '../components/ScreenHero';
import { getSecurityConfig } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [registrationAvailable, setRegistrationAvailable] = useState<boolean | null>(null);
  const [requiresInvite, setRequiresInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const config = await getSecurityConfig();
        setRegistrationAvailable(config.registration_available);
        setRequiresInvite(config.registration_requires_invite);
      } catch {
        setRegistrationAvailable(false);
      }
    })();
  }, []);

  const onSubmit = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Email, пароль и ФИО обязательны');
      return;
    }
    if (requiresInvite && !inviteCode.trim()) {
      setError('Введите код приглашения от администратора');
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
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        license_expiry: licenseExpiry.trim() || undefined,
        medical_check_expiry: medicalExpiry.trim() || undefined,
        invite_code: inviteCode.trim() || undefined,
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
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={[screenUi.card, { padding: 24, borderRadius: 16 }]}>
          <ScreenHero
            title="📝 Регистрация водителя"
            subtitle="Только для сотрудников компании · админ создаёт аккаунты в разделе «Водители»"
          />

          {registrationAvailable === false ? (
            <ErrorText message="Самостоятельная регистрация отключена. Попросите администратора создать аккаунт." />
          ) : null}

          {requiresInvite ? (
            <Field
              label="Код приглашения *"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              placeholder="Код от администратора"
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
          <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Номер водительского удостоверения" value={licenseNumber} onChangeText={setLicenseNumber} />
          <Field label="Срок действия прав (YYYY-MM-DD)" value={licenseExpiry} onChangeText={setLicenseExpiry} />
          <Field label="Срок медосмотра (YYYY-MM-DD)" value={medicalExpiry} onChangeText={setMedicalExpiry} />
          <ErrorText message={error} />
          <PrimaryButton
            label="✅ Зарегистрироваться"
            onPress={onSubmit}
            loading={loading}
            disabled={registrationAvailable === false}
          />
          <MenuButton label="← Назад ко входу" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </ScrollView>
    </View>
  );
}
