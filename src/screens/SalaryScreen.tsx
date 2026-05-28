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
import { listDrivers } from '../api/drivers';
import {
  createSalaryPayment,
  deleteSalaryPayment,
  getSalaryDebts,
  getSalarySummary,
  listSalaryPayments,
} from '../api/salary';
import { withFallback } from '../utils/safeRequest';
import type {
  Driver,
  DriverDebtSummary,
  DriverPaymentRecord,
  DriverPaymentType,
  DriverSalarySummary,
} from '../types';

const initialSummary: DriverSalarySummary = {
  driver_id: 0,
  gross: 0,
  paid: 0,
  deducted: 0,
  debt: 0,
};

const initialForm = {
  driver_id: 0,
  type: 'salary' as DriverPaymentType,
  amount: '',
  note: '',
};

const paymentTypeLabels: Record<DriverPaymentType, string> = {
  salary: 'Зарплата',
  advance: 'Аванс',
  bonus: 'Премия',
  deduction: 'Удержание',
};

export function SalaryScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [records, setRecords] = useState<DriverPaymentRecord[]>([]);
  const [debts, setDebts] = useState<DriverDebtSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [summary, setSummary] = useState<DriverSalarySummary>(initialSummary);
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
      const [driversData, recordsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listSalaryPayments(selectedDriverId ?? undefined), []),
      ]);
      setDrivers(driversData);
      setRecords(recordsData);
      setDebts(await withFallback(() => getSalaryDebts(), []));
      if (selectedDriverId) {
        setSummary(await withFallback(() => getSalarySummary(selectedDriverId), initialSummary));
      } else {
        setSummary(initialSummary);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить зарплаты'));
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
    const amount = Number(form.amount.replace(',', '.'));
    if (!form.driver_id) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    setSaving(true);
    try {
      await createSalaryPayment({
        driver_id: form.driver_id,
        type: form.type,
        amount,
        note: form.note.trim() || undefined,
      });
      setForm(initialForm);
      await load();
      Alert.alert('Успех', 'Выплата сохранена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить выплату'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить выплату?', `Запись #${id} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSalaryPayment(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить выплату'));
          }
        },
      },
    ]);
  };

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
            <Title>Зарплаты водителей</Title>
            <Subtitle>Выплаты, авансы, премии и удержания</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Subtitle>Фильтр по водителю</Subtitle>
              <MenuButton
                label={selectedDriverId ? 'Показать всех' : 'Все водители'}
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
              <MenuButton label="Обновить" onPress={load} variant="secondary" />
              {selectedDriver ? (
                <>
                  <Subtitle>
                    {selectedDriver.full_name ?? selectedDriver.email}
                    {selectedDriver.car_number ? ` (${selectedDriver.car_number})` : ''}
                  </Subtitle>
                  <Subtitle>Начислено (до выплат): {summary.gross.toFixed(2)} ₽</Subtitle>
                  <Subtitle>Выплачено: {summary.paid.toFixed(2)} ₽</Subtitle>
                  <Subtitle>Удержано: {summary.deducted.toFixed(2)} ₽</Subtitle>
                  <Title>Долг: {summary.debt.toFixed(2)} ₽</Title>
                </>
              ) : null}
            </Card>

            <Card>
              <Title>Реестр задолженности</Title>
              {debts.slice(0, 20).map((item) => (
                <Subtitle key={item.driver_id}>
                  {(item.driver_name ?? `Водитель #${item.driver_id}`) +
                    (item.driver_car_number ? ` (${item.driver_car_number})` : '')}
                  : долг {item.debt.toFixed(2)} ₽
                </Subtitle>
              ))}
            </Card>

            <Card>
              <Title>Новая выплата</Title>
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
              <Field
                label="Комментарий"
                value={form.note}
                onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
              />
              {(Object.keys(paymentTypeLabels) as DriverPaymentType[]).map((type) => (
                <MenuButton
                  key={type}
                  label={`${form.type === type ? '✅ ' : ''}${paymentTypeLabels[type]}`}
                  onPress={() => setForm((prev) => ({ ...prev, type }))}
                  variant={form.type === type ? 'default' : 'secondary'}
                />
              ))}
              <PrimaryButton label="Сохранить выплату" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {paymentTypeLabels[item.type]} · {item.amount} ₽
            </Subtitle>
            <Title>
              {item.driver_name}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Title>
            <Subtitle>{item.created_at}</Subtitle>
            {item.note ? <Subtitle>{item.note}</Subtitle> : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Записей по зарплатам пока нет" />}
      />
    </View>
  );
}
