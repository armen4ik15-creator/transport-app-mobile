import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { listOrders } from '../api/orders';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { screenUi } from '../styles/screenUi';
import { STATUS_LABEL, type Order } from '../types';
import type { RootStackParamList } from '../navigation/types';

const PAGE_SIZE = 20;

export function DriverOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, driver } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrders(await listOrders());
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить заказы');
      setError(msg);
      Alert.alert('Ошибка', msg);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [orders]);

  const pagedOrders = useMemo(() => orders.slice(0, visibleCount), [orders, visibleCount]);
  const canLoadMore = orders.length > visibleCount;

  if (loading && orders.length === 0) return <LoadingScreen label="Загрузка заказов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={pagedOrders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📦 Мои заказы" showBack={false} />
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              {driver?.full_name ?? user?.full_name ?? user?.email} · 🚚{' '}
              {driver?.car_number ?? 'без номера'}
            </Text>
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Заказов</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{orders.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
              {item.contractor_name ?? 'Без контрагента'}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              #{item.id} · {STATUS_LABEL[item.status]}
            </Text>
            {item.material ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.quantity != null ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>⚖️ {item.quantity}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
                style={{ flex: 1, backgroundColor: '#2563eb', paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Открыть</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('TripCreate', { orderId: item.id })}
                style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>🧾 Рейс</Text>
              </Pressable>
            </View>
          </View>
        )}
        onEndReached={() => {
          if (canLoadMore) setVisibleCount((prev) => prev + PAGE_SIZE);
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          canLoadMore ? (
            <MenuButton
              label="Показать ещё"
              onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              variant="secondary"
            />
          ) : null
        }
        ListEmptyComponent={<Text style={screenUi.emptyText}>Заказов нет. Потяните вниз, чтобы обновить.</Text>}
      />
    </View>
  );
}
