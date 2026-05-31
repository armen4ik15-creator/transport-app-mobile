import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { getReportSummary, type ReportSummary } from '../api/reports';
import { useAuth } from '../auth/AuthContext';
import { listDrivers } from '../api/drivers';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import type { Driver } from '../types';

const emptySummary: ReportSummary = {
  orders_total: 0,
  orders_completed: 0,
  documents_total: 0,
  expenses_total: 0,
  expenses_amount: 0,
  income: 0,
  expense: 0,
  balance: 0,
};

export function ReportsScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSummary(
        await getReportSummary({
          from: from.trim() || undefined,
          to: to.trim() || undefined,
          driver_id: user?.role === 'admin' && driverId ? driverId : undefined,
        })
      );
      if (user?.role === 'admin') {
        setDrivers(await listDrivers());
      }
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить отчёт');
      setError(msg);
      Alert.alert('Ошибка', msg);
    }
  }, [from, to, driverId, user?.role]);

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

  const onExportExcel = async () => {
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: from.trim() || undefined,
        date_to: to.trim() || undefined,
        driver_id: user?.role === 'admin' ? driverId ?? undefined : undefined,
      });
      await downloadAndShareExcel(`/export/financial-report${query}`, 'otchet_finansy.xlsx');
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    { label: 'Заказы', value: String(summary.orders_total), color: '#2563eb' },
    { label: 'Завершено', value: String(summary.orders_completed), color: '#16a34a' },
    { label: 'Документы', value: String(summary.documents_total), color: '#7c3aed' },
    { label: 'Расходы (шт.)', value: String(summary.expenses_total), color: '#f59e0b' },
    { label: 'Сумма расходов', value: `${summary.expenses_amount} ₽`, color: '#ef4444' },
    { label: 'Доход', value: `${summary.income} ₽`, color: '#16a34a' },
    { label: 'Расход', value: `${summary.expense} ₽`, color: '#ef4444' },
    { label: 'Баланс', value: `${summary.balance} ₽`, color: '#2563eb' },
  ];

  if (loading) return <LoadingScreen label="Загрузка отчёта…" />;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="📊 Статистика и отчёты" />
      <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        {user?.role === 'admin'
          ? 'Сводка по заказам, документам и финансам'
          : 'Сводка только по вашим данным'}
      </Text>
      <ErrorText message={error} />

      <View style={screenUi.card}>
        <Text style={screenUi.fieldLabel}>Фильтры</Text>
        <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
        {user?.role === 'admin' ? (
          <>
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={driverId == null ? 'all' : String(driverId)}
              onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
            />
          </>
        ) : null}
        <MenuButton label="🔍 Применить" onPress={load} variant="secondary" />
        <ExcelExportButton loading={exporting} onPress={() => void onExportExcel()} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {statCards.map((card) => (
          <View
            key={card.label}
            style={{
              width: '48%',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              padding: 12,
            }}
          >
            <Text style={screenUi.sumLabel}>{card.label}</Text>
            <Text style={[screenUi.sumValue, { color: card.color }]}>{card.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
