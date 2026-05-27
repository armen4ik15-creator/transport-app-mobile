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
import { createExpense, deleteExpense, listExpenses } from '../api/expenses';
import { listDrivers } from '../api/drivers';
import { useAuth } from '../auth/AuthContext';
import type { Driver, ExpenseMethod, ExpenseRecord } from '../types';

const initialForm = {
  exp_date: '',
  exp_type: 'fuel',
  method: 'cash' as ExpenseMethod,
  amount: '',
  comment: '',
  driver_id: 0,
};

function formatMethod(method: ExpenseMethod): string {
  if (method === 'cash') return 'Наличные';
  if (method === 'noncash') return 'Безнал';
  return 'Не указано';
}

export function ExpensesScreen() {
  const { user, driver } = useAuth();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverFilterId, setDriverFilterId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const safeDriverId = driver?.id ?? 0;

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverFilterId) ?? null,
    [drivers, driverFilterId]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const params =
        isAdmin && driverFilterId
          ? { driver_id: driverFilterId, from: from.trim() || undefined, to: to.trim() || undefined }
          : { from: from.trim() || undefined, to: to.trim() || undefined };
      const [expenseData, driverData] = await Promise.all([
        listExpenses(params),
        isAdmin ? listDrivers() : Promise.resolve([] as Driver[]),
      ]);
      setRecords(expenseData);
      setDrivers(driverData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить расходы'));
    }
  }, [driverFilterId, from, isAdmin, to]);

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
    const amount = Number(form.amount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    const payload = {
      exp_date: form.exp_date.trim() || undefined,
      exp_type: form.exp_type.trim() || 'other',
      method: form.method,
      amount,
      comment: form.comment.trim() || undefined,
      driver_id: isAdmin ? (form.driver_id || undefined) : safeDriverId,
    };

    if (isAdmin && !payload.driver_id) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }

    setSaving(true);
    try {
      await createExpense(payload);
      setForm((prev) => ({ ...initialForm, driver_id: prev.driver_id }));
      await load();
      Alert.alert('Успех', 'Расход добавлен');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить расход'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить расход?', `Запись #${id} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить расход'));
          }
        },
      },
    ]);
  };

  const totalAmount = records.reduce((sum, item) => sum + item.amount, 0);

  if (loading && records.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>{isAdmin ? 'Расходы компании' : 'Мои расходы'}</Title>
            <Subtitle>
              {isAdmin
                ? 'Топливо, ремонты и прочие расходы'
                : 'Добавляйте расходы по машине (например, заправки)'}
            </Subtitle>
            <ErrorText message={error} />

            {isAdmin ? (
              <Card>
                <Subtitle>Фильтр по водителю</Subtitle>
                <MenuButton
                  label={driverFilterId ? 'Показать всех' : 'Все водители'}
                  onPress={() => setDriverFilterId(null)}
                  variant="secondary"
                />
                {drivers.map((d) => (
                  <MenuButton
                    key={d.id}
                    label={`${driverFilterId === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
                    onPress={() => setDriverFilterId(d.id)}
                    variant={driverFilterId === d.id ? 'default' : 'secondary'}
                  />
                ))}
                {selectedDriver ? (
                  <Subtitle>
                    Фильтр: {selectedDriver.full_name ?? selectedDriver.email}
                  </Subtitle>
                ) : null}
              </Card>
            ) : null}

            <Card>
              <Title>Фильтр периода</Title>
              <Field
                label="Дата от (YYYY-MM-DD)"
                value={from}
                onChangeText={setFrom}
                placeholder="2026-01-01"
              />
              <Field
                label="Дата до (YYYY-MM-DD)"
                value={to}
                onChangeText={setTo}
                placeholder="2026-12-31"
              />
              <MenuButton label="Применить фильтр" onPress={load} variant="secondary" />
              <Subtitle>Сумма расходов в выборке: {totalAmount.toFixed(2)} ₽</Subtitle>
            </Card>

            <Card>
              <Title>Новый расход</Title>
              <Field
                label="Дата (YYYY-MM-DD, необязательно)"
                value={form.exp_date}
                onChangeText={(value) => setForm((prev) => ({ ...prev, exp_date: value }))}
                placeholder="2026-05-27"
              />
              <Field
                label="Тип расхода"
                value={form.exp_type}
                onChangeText={(value) => setForm((prev) => ({ ...prev, exp_type: value }))}
                placeholder="fuel / service / toll / other"
              />
              <Field
                label="Сумма"
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
                keyboardType="decimal-pad"
              />
              <Field
                label="Комментарий"
                value={form.comment}
                onChangeText={(value) => setForm((prev) => ({ ...prev, comment: value }))}
              />
              {isAdmin ? (
                <>
                  <Subtitle>Водитель</Subtitle>
                  {drivers.map((d) => (
                    <MenuButton
                      key={d.id}
                      label={`${form.driver_id === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
                      onPress={() => setForm((prev) => ({ ...prev, driver_id: d.id }))}
                      variant={form.driver_id === d.id ? 'default' : 'secondary'}
                    />
                  ))}
                </>
              ) : null}
              <Subtitle>Способ оплаты</Subtitle>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.method === 'cash' ? '✅ Наличные' : 'Наличные'}
                    onPress={() => setForm((prev) => ({ ...prev, method: 'cash' }))}
                    variant={form.method === 'cash' ? 'default' : 'secondary'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.method === 'noncash' ? '✅ Безнал' : 'Безнал'}
                    onPress={() => setForm((prev) => ({ ...prev, method: 'noncash' }))}
                    variant={form.method === 'noncash' ? 'default' : 'secondary'}
                  />
                </View>
              </View>
              <PrimaryButton label="Сохранить расход" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {item.exp_type} · {item.amount.toFixed(2)} ₽
            </Subtitle>
            <Title>{item.driver_name ?? item.car_number ?? 'Без водителя'}</Title>
            <Subtitle>{item.exp_date}</Subtitle>
            <Subtitle>Оплата: {formatMethod(item.method)}</Subtitle>
            {item.comment ? <Subtitle>{item.comment}</Subtitle> : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Расходов пока нет" />}
      />
    </View>
  );
}
