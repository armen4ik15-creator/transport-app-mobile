import { useCallback, useState } from 'react';
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

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Заказы ({orders.length})</Title>
            <Subtitle>Тяните вниз — обновится с сервера</Subtitle>
            <ErrorText message={error} />
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
            {item.notes ? <Subtitle>Примечание: {item.notes}</Subtitle> : null}
            <MenuButton
              label="Открыть"
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              variant="secondary"
            />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Заказов пока нет" />}
      />
      <View style={{ padding: 16 }}>
        <MenuButton label="← Меню" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </View>
  );
}
