import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  EmptyText,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Subtitle,
  Title,
} from '../components/ui';
import { createDriver, deleteDriver, listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import type { Driver } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Drivers'>;

export function DriversScreen({ navigation }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [medicalExpiry, setMedicalExpiry] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDrivers(await listDrivers());
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить водителей');
      setError(msg);
      Alert.alert('Ошибка', msg);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onCreate = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      Alert.alert('Заполните', 'Email, пароль и ФИО обязательны');
      return;
    }
    setCreating(true);
    try {
      await createDriver({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        car_number: carNumber.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        license_expiry: licenseExpiry.trim() || undefined,
        medical_check_expiry: medicalExpiry.trim() || undefined,
        is_active: true,
      });
      setEmail('');
      setPassword('');
      setFullName('');
      setCarNumber('');
      setPhone('');
      setLicenseNumber('');
      setLicenseExpiry('');
      setMedicalExpiry('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать'));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = (d: Driver) => {
    Alert.alert('Удалить водителя?', d.full_name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDriver(d.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (loading && drivers.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={drivers}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Водители ({drivers.length})</Title>
            <Subtitle>Список из общей БД на сервере</Subtitle>
            <ErrorText message={error} />
            {showForm ? (
              <Card>
                <Field label="ФИО *" value={fullName} onChangeText={setFullName} />
                <Field
                  label="Email *"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field label="Пароль *" value={password} onChangeText={setPassword} secureTextEntry />
                <Field label="Госномер" value={carNumber} onChangeText={setCarNumber} autoCapitalize="characters" />
                <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Field label="ВУ номер" value={licenseNumber} onChangeText={setLicenseNumber} />
                <Field label="ВУ до (YYYY-MM-DD)" value={licenseExpiry} onChangeText={setLicenseExpiry} />
                <Field label="Медосмотр до (YYYY-MM-DD)" value={medicalExpiry} onChangeText={setMedicalExpiry} />
                <PrimaryButton label="Создать" onPress={onCreate} loading={creating} />
                <MenuButton label="Отмена" onPress={() => setShowForm(false)} variant="secondary" />
              </Card>
            ) : (
              <MenuButton label="➕ Добавить водителя" onPress={() => setShowForm(true)} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id}</Subtitle>
            <Title>{item.full_name ?? 'Без имени'}</Title>
            <Subtitle>{item.email}</Subtitle>
            <Subtitle>🚚 {item.car_number || 'без номера'}</Subtitle>
            {item.phone ? <Subtitle>📞 {item.phone}</Subtitle> : null}
            {item.license_number ? <Subtitle>ВУ: {item.license_number}</Subtitle> : null}
            {item.license_expiry ? <Subtitle>ВУ до: {item.license_expiry}</Subtitle> : null}
            {item.medical_check_expiry ? <Subtitle>Медосмотр до: {item.medical_check_expiry}</Subtitle> : null}
            <MenuButton label="🗑 Удалить" onPress={() => onDelete(item)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Водителей пока нет" />}
      />
      <View style={{ padding: 16 }}>
        <MenuButton label="← Меню" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </View>
  );
}
