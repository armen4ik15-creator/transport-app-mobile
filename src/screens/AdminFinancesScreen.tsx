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
import { listDrivers } from '../api/drivers';
import type { Driver, DriverBalance, FinanceRecord } from '../types';

const initialForm = {
  driver_id: '',
  type: 'income' as 'income' | 'expense',
  amount: '',
  description: '',
  order_id: '',
};

export function AdminFinancesScreen() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
      const [driversData, financesData] = await Promise.all([listDrivers(), listFinances(selectedDriverId ?? undefined)]);
      setDrivers(driversData);
      setRecords(financesData);
      if (selectedDriverId) {
        const b = await getDriverBalance(selectedDriverId);
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
      Alert.alert('Ошибка', 'Укажите ID водителя');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    const orderId = form.order_id.trim() ? Number(form.order_id) : null;
    if (orderId != null && (!Number.isFinite(orderId) || orderId <= 0)) {
      Alert.alert('Ошибка', 'order_id должен быть положительным числом');
      return;
    }

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
              <Field
                label="Driver ID (пусто = все)"
                value={selectedDriverId ? String(selectedDriverId) : ''}
                onChangeText={(value) =>
                  setSelectedDriverId(value.trim() ? Number(value) : null)
                }
                keyboardType="number-pad"
              />
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
              <Field
                label="Driver ID"
                value={form.driver_id}
                onChangeText={(value) => setForm((prev) => ({ ...prev, driver_id: value }))}
                keyboardType="number-pad"
              />
              <Field
                label="Сумма"
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
                keyboardType="decimal-pad"
              />
              <Field
                label="Order ID (необязательно)"
                value={form.order_id}
                onChangeText={(value) => setForm((prev) => ({ ...prev, order_id: value }))}
                keyboardType="number-pad"
              />
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
