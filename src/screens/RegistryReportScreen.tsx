import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { FilterChipRow } from '../components/FilterChipRow';
import { FilterDropdown } from '../components/FilterDropdown';
import { QuickPeriodRow } from '../components/QuickPeriodRow';
import { RegistryTypeToggle, type RegistryReportType } from '../components/RegistryTypeToggle';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { TripRegistryCard } from '../components/TripRegistryCard';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
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
import type { Driver, TripRecord, Vehicle } from '../types';
import { colors } from '../theme';

function tripRevenue(row: TripRecord): number {
  return (row.volume ?? 0) * (row.company_rate ?? 0);
}

export function RegistryReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initialBounds = getReportPeriodBounds('month');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [from, setFrom] = useState(initialBounds.from);
  const [to, setTo] = useState(initialBounds.to);
  const [registryType, setRegistryType] = useState<RegistryReportType>('general');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [rows, setRows] = useState<TripRecord[]>([]);
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
      const [driversData, vehiclesData, tripsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listVehicles(), []),
        withFallback(
          () =>
            listTrips({
              driver_id: driverId ?? undefined,
              from: from.trim() || undefined,
              to: to.trim() || undefined,
              status: 'completed',
            }),
          []
        ),
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      let filtered = tripsData.filter((item) => isTripCompleted(item));
      if (registryType === 'by_vehicle' && vehicleId != null) {
        const vehicle = vehiclesData.find((item) => item.id === vehicleId);
        if (vehicle?.plate_number) {
          filtered = filtered.filter((item) => item.driver_car_number === vehicle.plate_number);
        }
      }
      setRows(filtered);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить реестр'));
    }
  }, [driverId, from, registryType, to, vehicleId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((driver) => ({
        id: String(driver.id),
        label: driver.full_name ?? driver.email,
      })),
    ],
    [drivers]
  );

  const selectedVehicleLabel = useMemo(() => {
    if (vehicleId == null) return 'Все машины';
    return vehicles.find((v) => v.id === vehicleId)?.plate_number ?? 'Машина';
  }, [vehicleId, vehicles]);

  const pickVehicle = () => {
    Alert.alert('Автомобиль', undefined, [
      { text: 'Все машины', onPress: () => setVehicleId(null) },
      ...vehicles.map((v) => ({
        text: v.plate_number,
        onPress: () => setVehicleId(v.id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const totalRevenue = useMemo(() => rows.reduce((sum, row) => sum + tripRevenue(row), 0), [rows]);

  const onExport = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Укажите период', 'Выберите даты «С» и «ПО»');
      return;
    }
    if (registryType === 'by_vehicle' && vehicleId == null) {
      Alert.alert('Выберите машину', 'Для реестра по машине укажите автомобиль');
      return;
    }

    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: from.trim(),
        date_to: to.trim(),
        driver_id: driverId ?? undefined,
        vehicle_id: registryType === 'by_vehicle' ? vehicleId ?? undefined : undefined,
      });
      const filename =
        registryType === 'by_vehicle' ? 'reestr_po_mashine.xlsx' : 'reestr_perevozok.xlsx';
      await downloadAndShareExcel(`/export/registry${query}`, filename);
    } finally {
      setExporting(false);
    }
  };

  if (loading && drivers.length === 0 && rows.length === 0) {
    return <LoadingScreen label="Загрузка реестра…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="Реестр" showBack onBack={() => navigation.replace('AdminHome')} />
            <ScreenHero
              title="📑 Реестр рейсов"
              subtitle={`${rows.length} разгрузок · ${formatMoney(totalRevenue)} ₽`}
            />

            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>
              Быстрый период
            </Text>
            <QuickPeriodRow items={REPORT_PERIOD_ITEMS} activeId={reportPeriod} onSelect={setReportPeriod} />
            <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />

            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={driverId == null ? 'all' : String(driverId)}
              onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
            />

            <FilterDropdown icon="🚚" label={selectedVehicleLabel} onPress={pickVehicle} />

            <RegistryTypeToggle value={registryType} onChange={setRegistryType} />

            <ExcelExportButton
              label="📊 Скачать Excel"
              loading={exporting}
              onPress={() => void onExport()}
            />
            <Text style={[screenUi.hint, { marginBottom: 8 }]}>
              {registryType === 'by_vehicle'
                ? 'Экспорт: реестр по выбранной машине'
                : 'Экспорт: общий реестр перевозок'}
            </Text>

            <Pressable
              onPress={() => void load()}
              style={{
                marginBottom: 12,
                backgroundColor: '#eef2ff',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#bfdbfe',
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>🔍 Применить фильтр</Text>
            </Pressable>

            <ErrorText message={error} />

            {loading ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
            {!loading && rows.length === 0 ? (
              <Text style={screenUi.emptyText}>Нет рейсов за выбранный период</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <TripRegistryCard trip={item} />}
      />
    </View>
  );
}
