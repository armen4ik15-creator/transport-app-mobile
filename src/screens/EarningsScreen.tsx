import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen, MenuButton, PrimaryButton } from '../components/ui';
import { getEarningsSummary } from '../api/earnings';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import type { Driver, EarningsSummary } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Earnings'>;

const emptySummary: EarningsSummary = {
  total_trips: 0,
  total_volume: 0,
  estimated_income: 0,
  actual_income: 0,
  actual_expense: 0,
  actual_balance: 0,
};

export function EarningsScreen({ navigation }: Props) {
  const { user, driver } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setToday = () => {
    const date = new Date().toISOString().slice(0, 10);
    setFrom(date);
    setTo(date);
  };

  const setFirstShift = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setFrom(`${year}-${month}-01`);
    setTo(`${year}-${month}-15`);
  };

  const setSecondShift = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const lastDay = new Date(year, month + 1, 0).getDate();
    setFrom(`${year}-${monthStr}-16`);
    setTo(`${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`);
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const params =
        user?.role === 'admin'
          ? {
              from: from.trim() || undefined,
              to: to.trim() || undefined,
              driver_id: driverId ?? undefined,
            }
          : {
              from: from.trim() || undefined,
              to: to.trim() || undefined,
            };
      setSummary(await getEarningsSummary(params));
      if (user?.role === 'admin') {
        setDrivers(await listDrivers());
      }
    } catch (e) {
      const message = apiErrorMessage(e, 'Не удалось загрузить аналитику рейсов');
      setError(message);
      Alert.alert('Ошибка', message);
    }
  }, [driverId, from, to, user?.role]);

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
      await downloadAndShareExcel(`/export/earnings${query}`, 'nachisleniya.xlsx');
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    { label: 'Рейсов', value: String(summary.total_trips), color: '#2563eb' },
    { label: 'Объём', value: summary.total_volume.toFixed(2), color: '#7c3aed' },
    { label: 'Заработок (ставка × рейсы)', value: `${summary.estimated_income.toFixed(2)} ₽`, color: '#16a34a' },
    { label: 'Факт. доход', value: `${summary.actual_income.toFixed(2)} ₽`, color: '#16a34a' },
    { label: 'Факт. расход', value: `${summary.actual_expense.toFixed(2)} ₽`, color: '#ef4444' },
    { label: 'Факт. баланс', value: `${summary.actual_balance.toFixed(2)} ₽`, color: '#2563eb' },
  ];

  if (loading) return <LoadingScreen label="Загрузка аналитики…" />;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="🧮 Заработок и рейсы" />
      <ScreenHero title="💵 Начисления водителям" subtitle="Ставка за рейс · завершённые перевозки" />
      <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        {user?.role === 'admin'
          ? 'Сумма ставок водителя по завершённым рейсам (driver_rate из задачи)'
          : `${driver?.full_name ?? user?.email}: личная статистика рейсов`}
      </Text>
      <ErrorText message={error} />

      <View style={screenUi.card}>
        <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <MenuButton label="📅 Сегодня" onPress={setToday} variant="secondary" />
          </View>
          <View style={{ flex: 1 }}>
            <MenuButton label="1-15" onPress={setFirstShift} variant="secondary" />
          </View>
          <View style={{ flex: 1 }}>
            <MenuButton label="16-конец" onPress={setSecondShift} variant="secondary" />
          </View>
        </View>
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
        <PrimaryButton label="🔄 Обновить аналитику" onPress={() => void load()} />
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
