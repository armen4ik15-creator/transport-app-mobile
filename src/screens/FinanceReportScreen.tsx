import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listExpenses } from '../api/expenses';
import { listTrips } from '../api/trips';
import { withFallback } from '../utils/safeRequest';
import type { Driver, ExpenseRecord, TripRecord } from '../types';

interface FinanceRow {
  key: string;
  title: string;
  value: string;
}

export function FinanceReportScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params = {
        driver_id: driverId ?? undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      };
      const [driversData, tripsData, expensesData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listTrips(params), []),
        withFallback(() => listExpenses(params), []),
      ]);
      setDrivers(driversData);
      setTrips(tripsData);
      setExpenses(expensesData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить финансовый отчёт'));
    }
  }, [driverId, from, to]);

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

  const totals = useMemo(() => {
    const tripCount = trips.length;
    const totalVolume = trips.reduce((sum, row) => sum + (row.volume ?? 0), 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);
    return { tripCount, totalVolume, totalExpenses };
  }, [trips, expenses]);

  const rows: FinanceRow[] = [
    { key: 'trips', title: 'Рейсов', value: String(totals.tripCount) },
    { key: 'volume', title: 'Суммарный объём', value: totals.totalVolume.toFixed(2) },
    { key: 'expenses', title: 'Расходы', value: `${totals.totalExpenses.toFixed(2)} ₽` },
  ];

  if (loading && trips.length === 0 && expenses.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Финансовый отчёт</Title>
            <Subtitle>Сводка по рейсам и расходам за период</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Field label="Дата от (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
              <Field label="Дата до (YYYY-MM-DD)" value={to} onChangeText={setTo} />
              <MenuButton
                label={driverId ? 'Показать всех водителей' : 'Все водители'}
                onPress={() => setDriverId(null)}
                variant="secondary"
              />
              {drivers.map((driver) => (
                <MenuButton
                  key={driver.id}
                  label={`${driverId === driver.id ? '✅ ' : ''}${driver.full_name ?? driver.email}`}
                  onPress={() => setDriverId(driver.id)}
                  variant={driverId === driver.id ? 'default' : 'secondary'}
                />
              ))}
              <MenuButton label="Применить фильтр" onPress={load} variant="secondary" />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>{item.title}</Title>
            <Subtitle>{item.value}</Subtitle>
          </Card>
        )}
        ListFooterComponent={
          <Card>
            <Subtitle>Детализация расходов: {expenses.length} записей</Subtitle>
            {expenses.slice(0, 10).map((item) => (
              <Subtitle key={item.id}>
                #{item.id} · {item.exp_type} · {item.amount.toFixed(2)} ₽ · {item.exp_date}
              </Subtitle>
            ))}
          </Card>
        }
        ListEmptyComponent={<EmptyText text="Нет данных за выбранный период" />}
      />
    </View>
  );
}
