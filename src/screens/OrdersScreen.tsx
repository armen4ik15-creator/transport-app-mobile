import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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
import { STATUS_LABEL, type Order } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;
const PAGE_SIZE = 20;

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean | null>(true);
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

  if (loading && orders.length === 0) return <LoadingScreen />;

  const visibleOrders = orders.filter((item) => {
    if (showOnlyActive === null) return true;
    return showOnlyActive ? Boolean(item.is_active) : !Boolean(item.is_active);
  });
  const pagedOrders = useMemo(
    () => visibleOrders.slice(0, visibleCount),
    [visibleCount, visibleOrders]
  );
  const canLoadMore = visibleOrders.length > visibleCount;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [orders, showOnlyActive]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={pagedOrders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Заказы ({orders.length})</Title>
            <Subtitle>Тяните вниз — обновится с сервера</Subtitle>
            <ErrorText message={error} />
            <MenuButton
              label={showOnlyActive === null ? '✅ Все' : 'Все'}
              onPress={() => setShowOnlyActive(null)}
              variant={showOnlyActive === null ? 'default' : 'secondary'}
            />
            <MenuButton
              label={showOnlyActive === true ? '✅ Активные' : 'Активные'}
              onPress={() => setShowOnlyActive(true)}
              variant={showOnlyActive === true ? 'default' : 'secondary'}
            />
            <MenuButton
              label={showOnlyActive === false ? '✅ Архив' : 'Архив'}
              onPress={() => setShowOnlyActive(false)}
              variant={showOnlyActive === false ? 'default' : 'secondary'}
            />
            <MenuButton
              label="➕ Создать новый заказ"
              onPress={() => navigation.navigate('OrderCreate')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id} · {STATUS_LABEL[item.status]}</Subtitle>
            <Title>{item.contractor_name ?? 'Без контрагента'}</Title>
            <Subtitle>
              Водитель: {item.driver_name ?? '—'}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Subtitle>
            {item.material ? <Subtitle>Материал: {item.material}</Subtitle> : null}
            {item.quantity != null ? <Subtitle>Количество: {item.quantity}</Subtitle> : null}
            {item.task_name ? <Subtitle>Задача: {item.task_name}</Subtitle> : null}
            {item.notes ? <Subtitle>Примечание: {item.notes}</Subtitle> : null}
            <MenuButton
              label="Открыть"
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              variant="secondary"
            />
            <MenuButton
              label="Редактировать"
              onPress={() => navigation.navigate('OrderEdit', { id: item.id })}
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
        ListEmptyComponent={<EmptyText text="Заказов пока нет" />}
      />
    </View>
  );
}
