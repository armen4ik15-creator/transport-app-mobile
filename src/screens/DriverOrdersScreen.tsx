import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { DriverTripActionCard } from '../components/DriverTripActionCard';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { listOrders } from '../api/orders';
import { listTrips } from '../api/trips';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { fetchCached, invalidateCache } from '../utils/apiCache';
import { buildOrderTripMap } from '../utils/orderTripMap';
import { screenUi } from '../styles/screenUi';
import { STATUS_LABEL, type Order } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

const PAGE_SIZE = 20;
const ORDERS_CACHE_KEY = 'driver:orders';
const TRIPS_CACHE_KEY = 'driver:trips';
const LIST_TTL_MS = 45_000;

export function DriverOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, driver } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tripMap, setTripMap] = useState(() => buildOrderTripMap([]));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      if (force) {
        invalidateCache('driver:');
      }
      const [orderData, tripData] = await Promise.all([
        fetchCached(ORDERS_CACHE_KEY, LIST_TTL_MS, () => listOrders({ limit: 200 })),
        fetchCached(TRIPS_CACHE_KEY, LIST_TTL_MS, () => listTrips()),
      ]);
      setOrders(orderData);
      setTripMap(buildOrderTripMap(tripData));
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить заказы');
      setError(msg);
      Alert.alert('Ошибка', msg);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
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
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📦 Мои заказы" showBack={false} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
              {driver?.full_name ?? user?.full_name ?? user?.email} · 🚚{' '}
              {driver?.car_number ?? 'без номера'}
            </Text>
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Заказов</Text>
                <Text style={[screenUi.sumValue, { color: colors.primary }]}>{orders.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {item.contractor_name ?? 'Без контрагента'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              #{item.id} · {STATUS_LABEL[item.status]}
            </Text>
            {item.material ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.quantity != null ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>⚖️ {item.quantity}</Text>
            ) : null}
            {item.load_address ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                📍 {item.load_address}
                {item.unload_address ? ` → ${item.unload_address}` : ''}
              </Text>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <DriverTripActionCard
                orderId={item.id}
                taskLabel={item.task_name ?? item.material ?? undefined}
                compact
                tripSnapshot={tripMap.get(item.id)}
              />
            </View>
            <Pressable
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              style={{ paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>ℹ️ Подробнее о заказе</Text>
            </Pressable>
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
