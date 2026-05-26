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
import { useAuth } from '../auth/AuthContext';
import { STATUS_LABEL, type Order } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MyOrders'>;

export function MyOrdersScreen({ navigation }: Props) {
  const { user, driver, signOut } = useAuth();
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

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
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
            <Title>Мои заказы ({orders.length})</Title>
            <Subtitle>
              {driver?.full_name ?? user?.email} · {driver?.car_number ?? 'без номера'}
            </Subtitle>
            <ErrorText message={error} />
            <MenuButton label="💰 Мои финансы" onPress={() => navigation.navigate('DriverFinances')} />
            <MenuButton label="📑 Мои документы" onPress={() => navigation.navigate('Documents')} />
            <MenuButton label="📊 Мои отчёты" onPress={() => navigation.navigate('Reports')} variant="secondary" />
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id} · {STATUS_LABEL[item.status]}</Subtitle>
            <Title>{item.contractor_name ?? 'Без контрагента'}</Title>
            {item.material ? <Subtitle>Материал: {item.material}</Subtitle> : null}
            {item.load_address ? <Subtitle>Погрузка: {item.load_address}</Subtitle> : null}
            {item.unload_address ? <Subtitle>Разгрузка: {item.unload_address}</Subtitle> : null}
            <MenuButton
              label="Открыть"
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
            />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Заказов нет. Потяните список вниз, чтобы обновить." />}
      />
      <View style={{ padding: 16 }}>
        <MenuButton label="Выйти" onPress={onLogout} variant="danger" />
      </View>
    </View>
  );
}
