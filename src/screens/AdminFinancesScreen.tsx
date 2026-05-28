import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
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
import { apiErrorMessage } from '../api/client';
import { createFinance, getDriverBalance, listFinances } from '../api/finances';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
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
      await load();
      Alert.alert('Успех', 'Операция добавлена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать операцию'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && records.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Финансы</Title>
            <Subtitle>Операции водителей: доходы и расходы</Subtitle>
            <ErrorText message={error} />

            <Card>
              <Subtitle>Фильтр по водителю</Subtitle>
              <MenuButton
                label={selectedDriverId ? 'Показать всех водителей' : 'Фильтр: все водители'}
                onPress={() => setSelectedDriverId(null)}
                variant="secondary"
              />
              {drivers.map((d) => (
                <MenuButton
                  key={d.id}
                  label={`${selectedDriverId === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
                  onPress={() => setSelectedDriverId(d.id)}
                  variant={selectedDriverId === d.id ? 'default' : 'secondary'}
                />
              ))}
              <MenuButton label="Применить фильтр" onPress={load} variant="secondary" />
              {selectedDriver ? (
                <Subtitle>
                  {selectedDriver.full_name}
                  {selectedDriver.car_number ? ` (${selectedDriver.car_number})` : ''}
                </Subtitle>
              ) : null}
              {balance ? (
                <>
                  <Subtitle>Доход: {balance.income} ₽</Subtitle>
                  <Subtitle>Расход: {balance.expense} ₽</Subtitle>
                  <Title>Баланс: {balance.balance} ₽</Title>
                </>
              ) : null}
            </Card>

            <Card>
              <Title>Новая операция</Title>
              <Subtitle>Водитель</Subtitle>
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
              <Subtitle>Связанный заказ (необязательно)</Subtitle>
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
                    label={`${form.order_id === o.id ? '✅ ' : ''}Заказ #${o.id} · ${o.contractor_name ?? 'Без контрагента'}`}
                    onPress={() => setForm((prev) => ({ ...prev, order_id: o.id }))}
                    variant={form.order_id === o.id ? 'default' : 'secondary'}
                  />
                ))}
              <Field
                label="Описание"
                value={form.description}
                onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.type === 'income' ? '✅ Доход' : 'Доход'}
                    onPress={() => setForm((prev) => ({ ...prev, type: 'income' }))}
                    variant={form.type === 'income' ? 'default' : 'secondary'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.type === 'expense' ? '✅ Расход' : 'Расход'}
                    onPress={() => setForm((prev) => ({ ...prev, type: 'expense' }))}
                    variant={form.type === 'expense' ? 'default' : 'secondary'}
                  />
                </View>
              </View>
              <PrimaryButton label="Добавить" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {item.type === 'income' ? 'Доход' : 'Расход'} · {item.amount} ₽
            </Subtitle>
            <Title>
              {item.driver_name}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Title>
            <Subtitle>Дата: {item.created_at}</Subtitle>
            {item.order_id ? <Subtitle>Заказ: #{item.order_id}</Subtitle> : null}
            {item.description ? <Subtitle>{item.description}</Subtitle> : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Финансовых операций пока нет" />}
      />
    </View>
  );
}
