import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listExpenses } from '../api/expenses';
import { listTrips, isTripCompleted } from '../api/trips';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { withFallback } from '../utils/safeRequest';
import type { Driver, ExpenseRecord, TripRecord } from '../types';

interface FinanceRow {
  key: string;
  title: string;
  value: string;
  color: string;
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
  const [exporting, setExporting] = useState(false);
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
        withFallback(() => listTrips({ ...params, status: 'completed' }), []),
        withFallback(() => listExpenses(params), []),
      ]);
      setDrivers(driversData);
      setTrips(tripsData.filter(isTripCompleted));
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

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const onExportExcel = async () => {
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: from.trim() || undefined,
        date_to: to.trim() || undefined,
        driver_id: driverId ?? undefined,
      });
      await downloadAndShareExcel(`/export/finances${query}`, 'finansy.xlsx');
    } finally {
      setExporting(false);
    }
  };

  const rows: FinanceRow[] = [
    { key: 'trips', title: '🚛 Рейсов', value: String(totals.tripCount), color: '#2563eb' },
    { key: 'volume', title: '⚖️ Суммарный объём', value: totals.totalVolume.toFixed(2), color: '#16a34a' },
    { key: 'expenses', title: '💸 Расходы', value: `${totals.totalExpenses.toFixed(2)} ₽`, color: '#ef4444' },
  ];

  if (loading && trips.length === 0 && expenses.length === 0) return <LoadingScreen label="Загрузка отчёта…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📊 Финансовый отчёт" />
            <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={driverId == null ? 'all' : String(driverId)}
              onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
            />
            <MenuButton label="🔍 Применить фильтр" onPress={load} variant="secondary" />
            <ExcelExportButton loading={exporting} onPress={() => void onExportExcel()} />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>{item.title}</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: item.color, marginTop: 4 }}>{item.value}</Text>
          </View>
        )}
        ListFooterComponent={
          expenses.length > 0 ? (
            <View style={screenUi.card}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                💸 Детализация расходов ({expenses.length})
              </Text>
              {expenses.slice(0, 10).map((item) => (
                <Text key={item.id} style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  #{item.id} · {item.exp_type} · {item.amount.toFixed(2)} ₽ · {item.exp_date}
                </Text>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={screenUi.emptyText}>Нет данных за выбранный период</Text>}
      />
    </View>
  );
}
