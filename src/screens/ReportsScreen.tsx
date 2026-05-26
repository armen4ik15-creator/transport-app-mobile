import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  Subtitle,
  Title,
} from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { getReportSummary, type ReportSummary } from '../api/reports';
import { useAuth } from '../auth/AuthContext';

const emptySummary: ReportSummary = {
  orders_total: 0,
  orders_completed: 0,
  documents_total: 0,
  income: 0,
  expense: 0,
  balance: 0,
};

export function ReportsScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSummary(
        await getReportSummary({
          from: from.trim() || undefined,
          to: to.trim() || undefined,
          driver_id:
            user?.role === 'admin' && driverId.trim() ? Number(driverId) : undefined,
        })
      );
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

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title>Статистика и отчёты</Title>
      <Subtitle>
        {user?.role === 'admin'
          ? 'Сводка по заказам, документам и финансам'
          : 'Сводка только по вашим данным'}
      </Subtitle>
      <ErrorText message={error} />

      <Card>
        <Title>Фильтры</Title>
        <Field
          label="Дата от (YYYY-MM-DD)"
          value={from}
          onChangeText={setFrom}
          placeholder="2026-01-01"
        />
        <Field
          label="Дата до (YYYY-MM-DD)"
          value={to}
          onChangeText={setTo}
          placeholder="2026-12-31"
        />
        {user?.role === 'admin' ? (
          <Field
            label="Driver ID (необязательно)"
            value={driverId}
            onChangeText={setDriverId}
            keyboardType="number-pad"
          />
        ) : null}
        <MenuButton label="Применить" onPress={load} variant="secondary" />
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Card>
            <Subtitle>Заказы</Subtitle>
            <Title>{summary.orders_total}</Title>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Subtitle>Завершено</Subtitle>
            <Title>{summary.orders_completed}</Title>
          </Card>
        </View>
      </View>

      <Card>
        <Subtitle>Документы</Subtitle>
        <Title>{summary.documents_total}</Title>
      </Card>
      <Card>
        <Subtitle>Доход</Subtitle>
        <Title>{summary.income} ₽</Title>
      </Card>
      <Card>
        <Subtitle>Расход</Subtitle>
        <Title>{summary.expense} ₽</Title>
      </Card>
      <Card>
        <Subtitle>Баланс</Subtitle>
        <Title>{summary.balance} ₽</Title>
      </Card>
    </ScrollView>
  );
}
