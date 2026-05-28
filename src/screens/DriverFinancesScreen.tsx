import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listFinances, getDriverBalance } from '../api/finances';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import { useAuth } from '../auth/AuthContext';
import type { FinanceRecord } from '../types';

export function DriverFinancesScreen() {
  const { driver } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [balance, setBalance] = useState<{ income: number; expense: number; balance: number } | null>(null);
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

  if (loading && records.length === 0) return <LoadingScreen label="Загрузка финансов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="💼 Мои финансы" />
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>👤 {title}</Text>
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Доход</Text>
                <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{balance?.income ?? 0} ₽</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Расход</Text>
                <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{balance?.expense ?? 0} ₽</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Баланс</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{balance?.balance ?? 0} ₽</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {item.type === 'income' ? '💵 Доход' : '💸 Расход'}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: item.type === 'income' ? '#16a34a' : '#ef4444',
                }}
              >
                {item.type === 'income' ? '+' : '−'}{item.amount} ₽
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              #{item.id} · {item.created_at}
            </Text>
            {item.order_id ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📦 Заказ #{item.order_id}</Text>
            ) : null}
            {item.description ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2, fontStyle: 'italic' }}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Операций пока нет</Text>}
      />
    </View>
  );
}
