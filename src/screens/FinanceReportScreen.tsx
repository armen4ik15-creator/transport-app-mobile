import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { FilterChipRow } from '../components/FilterChipRow';
import { QuickPeriodRow } from '../components/QuickPeriodRow';
import { RegistryTypeToggle, type RegistryReportType } from '../components/RegistryTypeToggle';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listExpenses } from '../api/expenses';
import { listTrips, isTripCompleted } from '../api/trips';
import { listVehicles } from '../api/vehicles';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import {
  formatMoney,
  getReportPeriodBounds,
  REPORT_PERIOD_ITEMS,
  type ReportPeriod,
} from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import type { Driver, ExpenseRecord, TripRecord, Vehicle } from '../types';

function tripRevenue(row: TripRecord): number {
  return (row.volume ?? 0) * (row.company_rate ?? 0);
}

function tripDriverPay(row: TripRecord): number {
  return row.driver_rate ?? 0;
}

export function FinanceReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initialBounds = getReportPeriodBounds('month');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [from, setFrom] = useState(initialBounds.from);
  const [to, setTo] = useState(initialBounds.to);
  const [reportType, setReportType] = useState<RegistryReportType>('general');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bounds = getReportPeriodBounds(reportPeriod);
    setFrom(bounds.from);
    setTo(bounds.to);
  }, [reportPeriod]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params = {
        driver_id: driverId ?? undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      };
      const [driversData, vehiclesData, tripsData, expensesData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listVehicles(), []),
        withFallback(() => listTrips({ ...params, status: 'completed' }), []),
        withFallback(() => listExpenses(params), []),
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      let filteredTrips = tripsData.filter(isTripCompleted);
      if (reportType === 'by_vehicle' && vehicleId != null) {
        const vehicle = vehiclesData.find((item) => item.id === vehicleId);
        if (vehicle?.plate_number) {
          filteredTrips = filteredTrips.filter(
            (item) => item.driver_car_number === vehicle.plate_number
          );
        }
      }
      setTrips(filteredTrips);
      setExpenses(expensesData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить финансовый отчёт'));
    }
  }, [driverId, from, reportType, to, vehicleId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const totals = useMemo(() => {
    const revenue = trips.reduce((sum, row) => sum + tripRevenue(row), 0);
    const driverPay = trips.reduce((sum, row) => sum + tripDriverPay(row), 0);
    const expenseTotal = expenses.reduce((sum, row) => sum + row.amount, 0);
    const totalCosts = expenseTotal + driverPay;
    const profit = revenue - totalCosts;
    return { revenue, driverPay, expenseTotal, totalCosts, profit, tripCount: trips.length };
  }, [trips, expenses]);

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const vehicleChips = useMemo(
    () => [
      { id: 'all', label: '🚚 Все машины' },
      ...vehicles.map((v) => ({ id: String(v.id), label: v.plate_number })),
    ],
    [vehicles]
  );

  const onExportExcel = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Укажите период', 'Выберите даты «С» и «ПО»');
      return;
    }
    if (reportType === 'by_vehicle' && vehicleId == null) {
      Alert.alert('Выберите машину', 'Для отчёта по машине укажите автомобиль');
      return;
    }

    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: from.trim(),
        date_to: to.trim(),
        driver_id: driverId ?? undefined,
        vehicle_id: reportType === 'by_vehicle' ? vehicleId ?? undefined : undefined,
      });
      await downloadAndShareExcel(`/export/financial-report${query}`, 'finansovyy_otchet.xlsx');
    } finally {
      setExporting(false);
    }
  };

  if (loading && trips.length === 0 && expenses.length === 0) {
    return <LoadingScreen label="Загрузка отчёта…" />;
  }

  return (
    <ScrollView style={screenUi.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={screenUi.content}>
        <ScreenHeader
          title="Финансовый отчёт"
          showBack
          onBack={() => navigation.goBack()}
        />

        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
          Быстрый выбор периода
        </Text>
        <QuickPeriodRow
          items={REPORT_PERIOD_ITEMS}
          activeId={reportPeriod}
          onSelect={setReportPeriod}
        />

        <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
        <RegistryTypeToggle value={reportType} onChange={setReportType} />

        <Text style={screenUi.filterLabel}>Водитель:</Text>
        <FilterChipRow
          items={driverChips}
          activeId={driverId == null ? 'all' : String(driverId)}
          onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
        />

        {reportType === 'by_vehicle' ? (
          <>
            <Text style={screenUi.filterLabel}>Автомобиль:</Text>
            <FilterChipRow
              items={vehicleChips}
              activeId={vehicleId == null ? 'all' : String(vehicleId)}
              onSelect={(id) => setVehicleId(id === 'all' ? null : Number(id))}
            />
          </>
        ) : null}

        <ExcelExportButton
          label="📥 Скачать финансовый Excel (.xlsx)"
          loading={exporting}
          onPress={() => void onExportExcel()}
        />
        <Text style={[screenUi.hint, { marginTop: 10 }]}>
          3 листа: Рейсы · Расходы · Прибыль (выручка − расходы − зарплата водителей)
        </Text>

        <Pressable
          onPress={() => void load()}
          style={{
            marginTop: 10,
            backgroundColor: '#eef2ff',
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#bfdbfe',
          }}
        >
          <Text style={{ color: '#2563eb', fontWeight: '600' }}>🔍 Применить фильтр</Text>
        </Pressable>

        <ErrorText message={error} />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#2563eb" />
        ) : (
          <View style={{ marginTop: 16, gap: 10 }}>
            {[
              { label: 'Выручка (из рейсов)', value: totals.revenue, color: '#16a34a' },
              { label: 'Расходы (учёт)', value: totals.expenseTotal, color: '#ef4444' },
              { label: 'Зарплата водителей', value: totals.driverPay, color: '#f59e0b' },
              { label: 'Прибыль', value: totals.profit, color: '#2563eb' },
            ].map((item) => (
              <View key={item.label} style={screenUi.card}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: item.color, marginTop: 4 }}>
                  {formatMoney(item.value)} ₽
                </Text>
              </View>
            ))}
            <Text style={screenUi.countLabel}>
              Рейсов: {totals.tripCount} · Статей расходов: {expenses.length}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
