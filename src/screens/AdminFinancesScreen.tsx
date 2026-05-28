import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createFinance, getDriverBalance, listFinances } from '../api/finances';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import type { Driver, DriverBalance, FinanceRecord, Order } from '../types';

const initialForm = {
  driver_id: 0,
  type: 'income' as 'income' | 'expense',
  amount: '',
  description: '',
  order_id: 0,
};

export function AdminFinancesScreen() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [balance, setBalance] = useState<DriverBalance | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const [driversData, financesData, ordersData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listFinances(selectedDriverId ?? undefined), []),
        withFallback(() => listOrders(), []),
      ]);
      setDrivers(driversData);
      setRecords(financesData);
      setOrders(ordersData);
      if (selectedDriverId) {
        const b = await withFallback(() => getDriverBalance(selectedDriverId), null);
        setBalance(b);
      } else {
        setBalance(null);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить финансы'));
    }
  }, [selectedDriverId]);

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

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const onCreate = async () => {
    const driverId = Number(form.driver_id);
    const amount = Number(form.amount);
    if (!driverId || !Number.isFinite(driverId)) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    const orderId = form.order_id > 0 ? form.order_id : null;

    setSaving(true);
    try {
      await createFinance({
        driver_id: driverId,
        type: form.type,
        amount,
        description: form.description.trim() || undefined,
        order_id: orderId,
      });
      setForm(initialForm);
      setFormVisible(false);
      await load();
      Alert.alert('Успех', 'Операция добавлена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать операцию'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && records.length === 0) return <LoadingScreen label="Загрузка финансов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="💰 Финансы" actionLabel="+ Операция" onAction={() => setFormVisible(true)} />
            <Text style={screenUi.filterLabel}>Фильтр по водителю:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={selectedDriverId == null ? 'all' : String(selectedDriverId)}
              onSelect={(id) => setSelectedDriverId(id === 'all' ? null : Number(id))}
            />
            <MenuButton label="🔄 Обновить" onPress={load} variant="secondary" />
            {selectedDriver && balance ? (
              <View style={screenUi.summaryBar}>
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Доход</Text>
                  <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{balance.income} ₽</Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Расход</Text>
                  <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{balance.expense} ₽</Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Баланс</Text>
                  <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{balance.balance} ₽</Text>
                </View>
              </View>
            ) : null}
            {selectedDriver ? (
              <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                👤 {selectedDriver.full_name}
                {selectedDriver.car_number ? ` (${selectedDriver.car_number})` : ''}
              </Text>
            ) : null}
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                {item.driver_name}
                {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: item.type === 'income' ? '#16a34a' : '#ef4444',
                }}
              >
                {item.type === 'income' ? '+' : '−'}{item.amount} ₽
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              #{item.id} · {item.type === 'income' ? '💵 Доход' : '💸 Расход'} · {item.created_at}
            </Text>
            {item.order_id ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📦 Заказ #{item.order_id}</Text>
            ) : null}
            {item.description ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2, fontStyle: 'italic' }}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Финансовых операций пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новая операция"
        saveLabel="Добавить"
        saving={saving}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          setForm(initialForm);
        }}
      >
        <Text style={screenUi.fieldLabel}>Водитель</Text>
        {drivers.map((d) => (
          <MenuButton
            key={d.id}
            label={`${form.driver_id === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
            onPress={() => setForm((prev) => ({ ...prev, driver_id: d.id }))}
            variant={form.driver_id === d.id ? 'default' : 'secondary'}
          />
        ))}
        <Field
          label="Сумма"
          value={form.amount}
          onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          keyboardType="decimal-pad"
        />
        <Text style={screenUi.fieldLabel}>Связанный заказ (необязательно)</Text>
        <MenuButton
          label={form.order_id ? 'Сбросить связь с заказом' : 'Без привязки к заказу'}
          onPress={() => setForm((prev) => ({ ...prev, order_id: 0 }))}
          variant="secondary"
        />
        {orders
          .filter((o) => !form.driver_id || o.driver_id === form.driver_id)
          .slice(0, 10)
          .map((o) => (
            <MenuButton
              key={o.id}
              label={`${form.order_id === o.id ? '✅ ' : ''}Заказ #${o.id} · ${o.contractor_name ?? '—'}`}
              onPress={() => setForm((prev) => ({ ...prev, order_id: o.id }))}
              variant={form.order_id === o.id ? 'default' : 'secondary'}
            />
          ))}
        <Field
          label="Описание"
          value={form.description}
          onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <MenuButton
              label={form.type === 'income' ? '✅ 💵 Доход' : '💵 Доход'}
              onPress={() => setForm((prev) => ({ ...prev, type: 'income' }))}
              variant={form.type === 'income' ? 'default' : 'secondary'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <MenuButton
              label={form.type === 'expense' ? '✅ 💸 Расход' : '💸 Расход'}
              onPress={() => setForm((prev) => ({ ...prev, type: 'expense' }))}
              variant={form.type === 'expense' ? 'default' : 'secondary'}
            />
          </View>
        </View>
      </FormBottomModal>
    </View>
  );
}
