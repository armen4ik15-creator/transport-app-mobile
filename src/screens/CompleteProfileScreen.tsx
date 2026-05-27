import { useState } from 'react';
import { Alert } from 'react-native';
import { Field, PrimaryButton, Screen, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { updateMyDriverProfile } from '../api/drivers';
import { useAuth } from '../auth/AuthContext';

export function CompleteProfileScreen() {
  const { user, driver, refresh } = useAuth();
  const [fullName, setFullName] = useState(driver?.full_name ?? user?.full_name ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? user?.phone ?? '');
  const [carNumber, setCarNumber] = useState(driver?.car_number ?? '');
  const [licenseNumber, setLicenseNumber] = useState(driver?.license_number ?? '');
  const [licenseExpiry, setLicenseExpiry] = useState(driver?.license_expiry ?? '');
  const [medicalExpiry, setMedicalExpiry] = useState(driver?.medical_check_expiry ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!fullName.trim() || !carNumber.trim()) {
      Alert.alert('Ошибка', 'ФИО и госномер обязательны');
      return;
    }
    setSaving(true);
    try {
      await updateMyDriverProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        car_number: carNumber.trim().toUpperCase(),
        license_number: licenseNumber.trim() || undefined,
        license_expiry: licenseExpiry.trim() || undefined,
        medical_check_expiry: medicalExpiry.trim() || undefined,
      });
      await refresh();
      Alert.alert('Готово', 'Профиль обновлён');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось обновить профиль'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>Заполните профиль водителя</Title>
      <Subtitle>Это нужно для корректной работы заказов, рейсов и отчётов.</Subtitle>
      <Field label="ФИО *" value={fullName} onChangeText={setFullName} />
      <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Госномер *" value={carNumber} onChangeText={setCarNumber} />
      <Field label="Номер прав" value={licenseNumber} onChangeText={setLicenseNumber} />
      <Field label="Срок прав (YYYY-MM-DD)" value={licenseExpiry} onChangeText={setLicenseExpiry} />
      <Field label="Срок медосмотра (YYYY-MM-DD)" value={medicalExpiry} onChangeText={setMedicalExpiry} />
      <PrimaryButton label="Сохранить профиль" onPress={onSave} loading={saving} />
    </Screen>
  );
}
