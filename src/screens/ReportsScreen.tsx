import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { getReportSummary, type ReportSummary } from '../api/reports';
import { useAuth } from '../auth/AuthContext';
import { listDrivers } from '../api/drivers';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { formatMoney, getReportPeriodBounds } from '../utils/datePeriods';
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

const defaultMonth = getReportPeriodBounds('month');

export function ReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [from, setFrom] = useState(defaultMonth.from);
  const [to, setTo] = useState(defaultMonth.to);
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

  const widgetCards = [
    { label: 'Общий доход', value: `${formatMoney(summary.income)} ₽`, color: '#16a34a', icon: '💰' },
    { label: 'Расход', value: `${formatMoney(summary.expense)} ₽`, color: '#ef4444', icon: '💸' },
    { label: 'Рейсов (заказы)', value: String(summary.orders_completed), color: '#2563eb', icon: '🚛' },
    { label: 'Баланс', value: `${formatMoney(summary.balance)} ₽`, color: '#7c3aed', icon: '⚖️' },
  ];

  const quickLinks: QuickAccessItem[] =
    user?.role === 'admin'
      ? [
          { icon: '📑', title: 'Реестр', subtitle: 'Все рейсы', color: '#2563eb', onPress: () => navigation.replace('RegistryReport') },
          { icon: '📊', title: 'Фин. отчёт', subtitle: 'Excel 3 листа', color: '#16a34a', onPress: () => navigation.navigate('FinanceReport') },
          { icon: '💵', title: 'Зарплаты', subtitle: 'Выплаты', color: '#f59e0b', onPress: () => navigation.navigate('Salary') },
          { icon: '💸', title: 'Расходы', subtitle: 'Учёт', color: '#ef4444', onPress: () => navigation.replace('Expenses') },
        ]
      : [];

  if (loading) return <LoadingScreen label="Загрузка отчёта…" />;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="📊 Отчёты" />
      <ScreenHero title="📈 Сводка" subtitle="Доход, расход и рейсы за период" />
      <ErrorText message={error} />

      <View style={screenUi.card}>
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
        <Pressable
          onPress={() => void load()}
          style={{
            backgroundColor: '#eef2ff',
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#2563eb', fontWeight: '600' }}>🔍 Обновить сводку</Text>
        </Pressable>
        <ExcelExportButton loading={exporting} onPress={() => void onExportExcel()} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {widgetCards.map((card) => (
          <View
            key={card.label}
            style={{
              width: '48%',
              backgroundColor: '#ffffff',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderLeftWidth: 4,
              borderLeftColor: card.color,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 22 }}>{card.icon}</Text>
            <Text style={screenUi.sumLabel}>{card.label}</Text>
            <Text style={[screenUi.sumValue, { color: card.color }]}>{card.value}</Text>
          </View>
        ))}
      </View>

      {quickLinks.length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 }}>
            Быстрые отчёты
          </Text>
          <QuickAccessGrid items={quickLinks} />
        </>
      ) : null}
    </ScrollView>
  );
}
