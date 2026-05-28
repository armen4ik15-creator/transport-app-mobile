import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  EmptyText,
  ErrorText,
  LoadingScreen,
  Subtitle,
  Title,
} from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listFinances, getDriverBalance } from '../api/finances';
import { withFallback } from '../utils/safeRequest';
import { useAuth } from '../auth/AuthContext';
import type { DriverBalance, FinanceRecord } from '../types';

export function DriverFinancesScreen() {
  const { driver } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [balance, setBalance] = useState<DriverBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!driver) return 'Мои финансы';
    return `${driver.full_name}${driver.car_number ? ` (${driver.car_number})` : ''}`;
  }, [driver]);

  const load = useCallback(async () => {
    if (!driver?.id) {
      setRecords([]);
      setBalance(null);
      return;
    }
    try {
      setError(null);
      const [recordsData, balanceData] = await Promise.all([
        withFallback(() => listFinances(), []),
        withFallback(() => getDriverBalance(driver.id), null),
      ]);
      setRecords(recordsData);
      setBalance(balanceData);
    } catch (e) {
      const message = apiErrorMessage(e, 'Не удалось загрузить финансы');
      setError(message);
      Alert.alert('Ошибка', message);
    }
  }, [driver?.id]);

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

  if (loading && records.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Мои финансы</Title>
            <Subtitle>{title}</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Subtitle>Доход: {balance?.income ?? 0} ₽</Subtitle>
              <Subtitle>Расход: {balance?.expense ?? 0} ₽</Subtitle>
              <Title>Баланс: {balance?.balance ?? 0} ₽</Title>
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {item.type === 'income' ? 'Доход' : 'Расход'} · {item.amount} ₽
            </Subtitle>
            {item.order_id ? <Subtitle>Заказ: #{item.order_id}</Subtitle> : null}
            <Subtitle>{item.created_at}</Subtitle>
            {item.description ? <Subtitle>{item.description}</Subtitle> : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Операций пока нет" />}
      />
    </View>
  );
}
