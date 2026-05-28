import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { createDriver, deleteDriver, listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import type { Driver } from '../types';

export function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
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

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        d.full_name?.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.car_number?.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCarNumber('');
    setPhone('');
    setLicenseNumber('');
    setLicenseExpiry('');
    setMedicalExpiry('');
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
      resetForm();
      setFormVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать'));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = (d: Driver) => {
    Alert.alert('Удалить водителя?', d.full_name ?? d.email, [
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

  if (loading && drivers.length === 0) return <LoadingScreen label="Загрузка водителей…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filtered}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="👤 Водители"
              showBack={false}
              actionLabel="+ Добавить"
              onAction={() => setFormVisible(true)}
            />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Поиск по имени, email…" />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Всего</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{drivers.length}</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Показано</Text>
                <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{filtered.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                  {item.full_name ?? 'Без имени'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  #{item.id} · {item.email}
                </Text>
                <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>
                  🚚 {item.car_number || 'без номера'}
                </Text>
                {item.phone ? (
                  <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📞 {item.phone}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Водителей пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новый водитель"
        saveLabel="Создать"
        saving={creating}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
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
      </FormBottomModal>
    </View>
  );
}
