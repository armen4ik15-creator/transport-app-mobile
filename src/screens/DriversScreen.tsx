import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHero } from '../components/ScreenHero';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { createDriver, deleteDriver, listDrivers, updateDriver } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import type { Driver } from '../types';

type DriverStatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS = [
  { id: 'all' as const, label: 'Все' },
  { id: 'active' as const, label: '✅ Активные' },
  { id: 'inactive' as const, label: '⛔ Неактивные' },
];

const emptyCreateForm = {
  email: '',
  password: '',
  full_name: '',
  car_number: '',
  phone: '',
  license_number: '',
  license_expiry: '',
  medical_expiry: '',
  is_active: true,
};

export function DriversScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCreateForm);
  const [saving, setSaving] = useState(false);

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
    return drivers.filter((d) => {
      if (statusFilter === 'active' && !d.is_active) return false;
      if (statusFilter === 'inactive' && Boolean(d.is_active)) return false;
      if (!q) return true;
      return (
        d.full_name?.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.car_number?.toLowerCase().includes(q)
      );
    });
  }, [drivers, searchQuery, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCreateForm);
    setFormVisible(true);
  };

  const openEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setForm({
      email: driver.email,
      password: '',
      full_name: driver.full_name ?? '',
      car_number: driver.car_number ?? '',
      phone: driver.phone ?? '',
      license_number: driver.license_number ?? '',
      license_expiry: driver.license_expiry ?? '',
      medical_expiry: driver.medical_check_expiry ?? '',
      is_active: Boolean(driver.is_active),
    });
    setFormVisible(true);
  };

  const onSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Заполните', 'ФИО обязательно');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDriver(editingId, {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          car_number: form.car_number.trim() || null,
          license_number: form.license_number.trim() || null,
          license_expiry: form.license_expiry.trim() || null,
          medical_check_expiry: form.medical_expiry.trim() || null,
          is_active: form.is_active,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        });
      } else {
        if (!form.email.trim() || !form.password) {
          Alert.alert('Заполните', 'Email и пароль обязательны для нового водителя');
          return;
        }
        if (!form.email.includes('@')) {
          Alert.alert('Заполните', 'Укажите корректный email (например driver@mail.ru)');
          return;
        }
        await createDriver({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || undefined,
          car_number: form.car_number.trim() || undefined,
          license_number: form.license_number.trim() || undefined,
          license_expiry: form.license_expiry.trim() || undefined,
          medical_check_expiry: form.medical_expiry.trim() || undefined,
          is_active: form.is_active,
        });
      }
      setForm(emptyCreateForm);
      setEditingId(null);
      setFormVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить'));
    } finally {
      setSaving(false);
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

  if (loading && drivers.length === 0) {
    return <LoadingScreen label="Загрузка водителей…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filtered}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="Водители"
              showBack
              onBack={() => navigation.replace('AdminHome')}
              actionLabel="+"
              onAction={openCreate}
            />
            <ScreenHero title="👤 Водители" subtitle={`${filtered.length} в списке`} />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Поиск по имени или машине" />
            <FilterChipRow items={STATUS_FILTERS} activeId={statusFilter} onSelect={setStatusFilter} />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => {
          const active = Boolean(item.is_active);
          return (
            <Pressable
              style={[screenUi.card, { borderRadius: 14 }]}
              onPress={() => openEdit(item)}
              onLongPress={() => onDelete(item)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={screenUi.cardTitle}>{item.full_name ?? 'Без имени'}</Text>
                  {item.phone ? (
                    <Text style={screenUi.cardBody}>📞 {item.phone}</Text>
                  ) : null}
                  <Text style={screenUi.cardBodySm}>
                    🚚 {item.car_number || 'без номера'}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <StatusBadge
                      label={active ? 'Активен' : 'Неактивен'}
                      color={active ? colors.profit : colors.loss}
                    />
                  </View>
                </View>
                <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                  <Text style={screenUi.dangerIcon}>🗑</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading || refreshing ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
          ) : (
            <Text style={screenUi.emptyText}>Водителей пока нет</Text>
          )
        }
      />

      <FormBottomModal
        visible={formVisible}
        title={editingId ? '✏️ Редактировать водителя' : '➕ Новый водитель'}
        saveLabel={editingId ? 'Сохранить' : 'Создать'}
        saving={saving}
        onSave={onSave}
        onClose={() => {
          setFormVisible(false);
          setEditingId(null);
          setForm(emptyCreateForm);
        }}
      >
        <Field label="ФИО *" value={form.full_name} onChangeText={(v) => setForm((p) => ({ ...p, full_name: v }))} />
        {!editingId ? (
          <>
            <Field
              label="Email *"
              value={form.email}
              onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Пароль *"
              value={form.password}
              onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
              secureTextEntry
            />
          </>
        ) : null}
        {editingId ? (
          <Field
            label="Новый пароль (оставьте пустым, если не менять)"
            value={form.password}
            onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
            secureTextEntry
          />
        ) : null}
        <Field label="Телефон" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <Field label="Госномер" value={form.car_number} onChangeText={(v) => setForm((p) => ({ ...p, car_number: v }))} autoCapitalize="characters" />
        <Field label="ВУ номер" value={form.license_number} onChangeText={(v) => setForm((p) => ({ ...p, license_number: v }))} />
        <Field label="ВУ до (YYYY-MM-DD)" value={form.license_expiry} onChangeText={(v) => setForm((p) => ({ ...p, license_expiry: v }))} />
        <Field label="Медосмотр до (YYYY-MM-DD)" value={form.medical_expiry} onChangeText={(v) => setForm((p) => ({ ...p, medical_expiry: v }))} />
        <MenuButton
          label={form.is_active ? '✅ Активен' : '⛔ Неактивен'}
          onPress={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
          variant={form.is_active ? 'default' : 'secondary'}
        />
      </FormBottomModal>
    </View>
  );
}
