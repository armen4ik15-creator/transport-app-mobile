import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FilterChipRow } from '../components/FilterChipRow';
import { QuickPeriodRow } from '../components/QuickPeriodRow';
import { RegistryTypeToggle, type RegistryReportType } from '../components/RegistryTypeToggle';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listTrips } from '../api/trips';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import {
  getQuickPeriodBounds,
  todayIso,
  type QuickPeriod,
} from '../utils/datePeriods';
import { buildRegistryCsv } from '../utils/registryExport';
import { withFallback } from '../utils/safeRequest';
import type { Driver, TripRecord } from '../types';

export function RegistryReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initialBounds = getQuickPeriodBounds('30days');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('30days');
  const [from, setFrom] = useState(initialBounds.from);
  const [to, setTo] = useState(initialBounds.to);
  const [registryType, setRegistryType] = useState<RegistryReportType>('general');
  const [carNumber, setCarNumber] = useState<string | null>(null);
  const [rows, setRows] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bounds = getQuickPeriodBounds(quickPeriod);
    setFrom(bounds.from);
    setTo(bounds.to);
  }, [quickPeriod]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [driversData, tripsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(
          () =>
            listTrips({
              from: from.trim() || undefined,
              to: to.trim() || undefined,
            }),
          []
        ),
      ]);
      setDrivers(driversData);
      let filtered = tripsData.filter((item) => item.stage === 'unloading');
      if (registryType === 'by_vehicle' && carNumber) {
        filtered = filtered.filter((item) => item.driver_car_number === carNumber);
      }
      setRows(filtered);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить реестр'));
    }
  }, [carNumber, from, registryType, to]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const carChips = useMemo(() => {
    const numbers = [
      ...new Set(
        drivers.map((driver) => driver.car_number?.trim()).filter(Boolean) as string[]
      ),
    ].sort();
    return [{ id: 'all', label: '🚚 Все машины' }, ...numbers.map((num) => ({ id: num, label: num }))];
  }, [drivers]);

  const onExport = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Укажите период', 'Заполните даты «С» и «ПО»');
      return;
    }
    if (registryType === 'by_vehicle' && !carNumber) {
      Alert.alert('Выберите машину', 'Для реестра по машине укажите госномер');
      return;
    }
    setExporting(true);
    try {
      const tripsData = await withFallback(
        () =>
          listTrips({
            from: from.trim(),
            to: to.trim(),
          }),
        []
      );
      let filtered = tripsData.filter((item) => item.stage === 'unloading');
      if (registryType === 'by_vehicle' && carNumber) {
        filtered = filtered.filter((item) => item.driver_car_number === carNumber);
      }
      if (filtered.length === 0) {
        Alert.alert('Нет данных', 'За выбранный период разгрузок не найдено');
        return;
      }
      const csv = buildRegistryCsv(filtered);
      await Share.share({
        message: csv,
        title: `reestr_${from}_${to}.csv`,
      });
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось выгрузить реестр'));
    } finally {
      setExporting(false);
    }
  };

  if (loading && drivers.length === 0 && rows.length === 0) {
    return <LoadingScreen label="Загрузка реестра…" />;
  }

  return (
    <ScrollView style={screenUi.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={screenUi.content}>
        <ScreenHeader
          title="Реестр"
          showBack
          onBack={() => navigation.replace('AdminHome')}
        />

        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
          Быстрый выбор периода
        </Text>
        <QuickPeriodRow
          items={[
            { id: 'today', label: 'Сегодня' },
            { id: '7days', label: '7 дней' },
            { id: '30days', label: '30 дней' },
            { id: '90days', label: '90 дней' },
          ]}
          activeId={quickPeriod}
          onSelect={setQuickPeriod}
        />

        <Field
          label="Дата С (ГГГГ-ММ-ДД)"
          value={from}
          onChangeText={setFrom}
          placeholder={todayIso()}
        />
        <Field
          label="Дата ПО (ГГГГ-ММ-ДД)"
          value={to}
          onChangeText={setTo}
          placeholder={todayIso()}
        />

        <RegistryTypeToggle value={registryType} onChange={setRegistryType} />

        {registryType === 'by_vehicle' ? (
          <>
            <Text style={screenUi.filterLabel}>Машина:</Text>
            <FilterChipRow
              items={carChips}
              activeId={carNumber ?? 'all'}
              onSelect={(id) => setCarNumber(id === 'all' ? null : id)}
            />
          </>
        ) : null}

        <Pressable
          onPress={onExport}
          disabled={exporting}
          style={{
            backgroundColor: '#16a34a',
            borderRadius: 10,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
            opacity: exporting ? 0.7 : 1,
          }}
        >
          {exporting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
              📥 Скачать реестр Excel (.xlsx)
            </Text>
          )}
        </Pressable>
        <Text style={[screenUi.hint, { marginTop: 10 }]}>
          Файл откроется в Excel, Google Таблицах или любом совместимом приложении
        </Text>

        <ErrorText message={error} />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#2563eb" />
        ) : (
          <Text style={[screenUi.countLabel, { textAlign: 'left', marginTop: 16 }]}>
            Разгрузок за период: {rows.length}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
