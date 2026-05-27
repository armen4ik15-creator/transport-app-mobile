import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Subtitle,
  Title,
} from '../components/ui';
import { getEarningsSummary } from '../api/earnings';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import type { Driver, EarningsSummary } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';

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

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title>Заработок и рейсы</Title>
      <Subtitle>
        {user?.role === 'admin'
          ? 'Оценка заработка по рейсам и фактические финансы'
          : `${driver?.full_name ?? user?.email}: личная статистика рейсов`}
      </Subtitle>
      <ErrorText message={error} />

      <Card>
        <Field label="Дата от (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
        <Field label="Дата до (YYYY-MM-DD)" value={to} onChangeText={setTo} />
        <MenuButton label="Сегодня" onPress={setToday} variant="secondary" />
        <MenuButton label="Вахта 1 (1-15)" onPress={setFirstShift} variant="secondary" />
        <MenuButton label="Вахта 2 (16-конец)" onPress={setSecondShift} variant="secondary" />
        {user?.role === 'admin' ? (
          <>
            <Subtitle>Фильтр по водителю</Subtitle>
            <MenuButton
              label={driverId ? 'Показать всех водителей' : 'Все водители'}
              onPress={() => setDriverId(null)}
              variant="secondary"
            />
            {drivers.map((driverItem) => (
              <MenuButton
                key={driverItem.id}
                label={`${driverId === driverItem.id ? '✅ ' : ''}${driverItem.full_name ?? driverItem.email}`}
                onPress={() => setDriverId(driverItem.id)}
                variant={driverId === driverItem.id ? 'default' : 'secondary'}
              />
            ))}
          </>
        ) : null}
        <PrimaryButton label="Обновить аналитику" onPress={() => void load()} />
      </Card>

      <Card>
        <Subtitle>Рейсов: {summary.total_trips}</Subtitle>
        <Subtitle>Объём: {summary.total_volume.toFixed(2)}</Subtitle>
        <Subtitle>Оценочный доход по ставке: {summary.estimated_income.toFixed(2)}</Subtitle>
        <Subtitle>Фактический доход: {summary.actual_income.toFixed(2)}</Subtitle>
        <Subtitle>Фактический расход: {summary.actual_expense.toFixed(2)}</Subtitle>
        <Title>Фактический баланс: {summary.actual_balance.toFixed(2)}</Title>
      </Card>

      <View style={{ marginTop: 8 }}>
        <MenuButton label="← Назад" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </ScrollView>
  );
}
