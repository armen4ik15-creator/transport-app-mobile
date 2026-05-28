import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  EmptyText,
  ErrorText,
  LoadingScreen,
  MenuButton,
  Subtitle,
  Title,
} from '../components/ui';
import { listOrders } from '../api/orders';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
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

  const pagedOrders = useMemo(
    () => orders.slice(0, visibleCount),
    [orders, visibleCount]
  );
  const canLoadMore = orders.length > visibleCount;

  if (loading && orders.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={pagedOrders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Мои заказы ({orders.length})</Title>
            <Subtitle>
              {driver?.full_name ?? user?.full_name ?? user?.email} · {driver?.car_number ?? 'без номера'}
            </Subtitle>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id} · {STATUS_LABEL[item.status]}</Subtitle>
            <Title>{item.contractor_name ?? 'Без контрагента'}</Title>
            {item.material ? <Subtitle>Материал: {item.material}</Subtitle> : null}
            {item.quantity != null ? <Subtitle>Объём: {item.quantity}</Subtitle> : null}
            {item.notes ? <Subtitle>Примечание: {item.notes}</Subtitle> : null}
            <MenuButton
              label="Открыть"
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
            />
            <MenuButton
              label="Загрузка / Разгрузка"
              onPress={() => navigation.navigate('TripCreate', { orderId: item.id })}
              variant="secondary"
            />
          </Card>
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
        ListEmptyComponent={<EmptyText text="Заказов нет. Потяните вниз, чтобы обновить." />}
      />
    </View>
  );
}
