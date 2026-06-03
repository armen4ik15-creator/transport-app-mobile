import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DailyReportCard } from '../components/DailyReportCard';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { getReportDaily, getReportSummary, type ReportDailyRow, type ReportSummary } from '../api/reports';
import { useAuth } from '../auth/AuthContext';
import { listDrivers } from '../api/drivers';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { formatMoney, getReportPeriodBounds } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
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
  trips_count: 0,
  revenue: 0,
  driver_pay: 0,
  profit: 0,
};

const emptyDailyTotals = {
  trips_count: 0,
  revenue: 0,
  driver_pay: 0,
  expenses: 0,
  costs: 0,
  profit: 0,
};

const defaultMonth = getReportPeriodBounds('month');

function formatDayTitle(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function SelectedDayPanel({ row }: { row: ReportDailyRow }) {
  return (
    <View
      style={[
        screenUi.card,
        {
          borderRadius: 14,
          borderWidth: 2,
          borderColor: '#2563eb',
          backgroundColor: '#eff6ff',
          marginBottom: 14,
        },
      ]}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb', marginBottom: 6 }}>
        📅 Выбранный день
      </Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 }}>
        {formatDayTitle(row.date)}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <DayMetric label="Выручка" value={row.revenue} color="#16a34a" />
        <DayMetric label="Расходы учёт" value={row.expenses} color="#ef4444" />
        <DayMetric label="Зарплата рейсов" value={row.driver_pay} color="#f59e0b" />
        <DayMetric label="Рейсов" value={row.trips_count} color="#2563eb" suffix="" />
        <DayMetric label="Прибыль" value={row.profit} color={row.profit >= 0 ? '#16a34a' : '#ef4444'} />
      </View>
    </View>
  );
}

function DayMetric({
  label,
  value,
  color,
  suffix = ' ₽',
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  const display = suffix === '' ? String(value) : `${formatMoney(value)}${suffix}`;
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#dbeafe',
      }}
    >
      <Text style={{ fontSize: 11, color: '#6b7280' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '800', color, marginTop: 2 }}>{display}</Text>
    </View>
  );
}

export function ReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [dailyRows, setDailyRows] = useState<ReportDailyRow[]>([]);
  const [from, setFrom] = useState(defaultMonth.from);
  const [to, setTo] = useState(defaultMonth.to);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const fromIso = from.trim();
    const toIso = to.trim();
    if (!fromIso || !toIso) {
      setError('Укажите даты периода');
      return;
    }

    try {
      setError(null);
      const driverParam = user?.role === 'admin' && driverId ? driverId : undefined;
      const [summaryData, dailyData] = await Promise.all([
        getReportSummary({ from: fromIso, to: toIso, driver_id: driverParam }),
        withFallback(
          () => getReportDaily({ from: fromIso, to: toIso, driver_id: driverParam }),
          { days: [], totals: emptyDailyTotals }
        ),
      ]);
      setSummary(summaryData);
      setDailyRows(dailyData.days);
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

  const onCalendarDay = (iso: string) => {
    setSelectedDay(iso);
    void load();
  };

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const selectedDayRow = useMemo(() => {
    if (!selectedDay) return null;
    return dailyRows.find((row) => row.date === selectedDay) ?? {
      date: selectedDay,
      trips_count: 0,
      revenue: 0,
      driver_pay: 0,
      expenses: 0,
      expenses_count: 0,
      costs: 0,
      profit: 0,
    };
  }, [dailyRows, selectedDay]);

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

  const tripsCount = summary.trips_count ?? summary.orders_completed;
  const revenue = summary.revenue ?? summary.income;
  const totalCosts = summary.expense;
  const profit = summary.profit ?? summary.balance;

  const widgetCards = [
    { label: 'Выручка (рейсы)', value: `${formatMoney(revenue)} ₽`, color: '#16a34a', icon: '💰' },
    { label: 'Расходы всего', value: `${formatMoney(totalCosts)} ₽`, color: '#ef4444', icon: '💸' },
    { label: 'Рейсов', value: String(tripsCount), color: '#2563eb', icon: '🚛' },
    { label: 'Прибыль', value: `${formatMoney(profit)} ₽`, color: profit >= 0 ? '#7c3aed' : '#ef4444', icon: '⚖️' },
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
      <ScreenHero title="📈 Сводка" subtitle="По дням: выручка, расходы и прибыль как в Excel" />
      <ErrorText message={error} />

      <View style={screenUi.card}>
        <DateRangePicker
          from={from}
          to={to}
          onChangeFrom={setFrom}
          onChangeTo={setTo}
          onDaySelected={onCalendarDay}
        />
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

      {selectedDayRow ? <SelectedDayPanel row={selectedDayRow} /> : null}

      <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
        📆 Итого за период
      </Text>
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

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 }}>
        📅 По дням ({dailyRows.length})
      </Text>
      {dailyRows.length === 0 ? (
        <Text style={screenUi.emptyText}>
          За выбранный период нет данных. Выберите день в календаре или расширьте период.
        </Text>
      ) : (
        dailyRows.map((row) => (
          <DailyReportCard
            key={row.date}
            row={row}
            selected={selectedDay === row.date}
            onPress={() => setSelectedDay(row.date)}
          />
        ))
      )}

      {quickLinks.length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 10 }}>
            Быстрые отчёты
          </Text>
          <QuickAccessGrid items={quickLinks} />
        </>
      ) : null}
    </ScrollView>
  );
}
