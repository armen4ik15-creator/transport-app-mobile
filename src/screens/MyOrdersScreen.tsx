import { useCallback, useEffect, useState } from 'react';
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
import { colors } from '../theme';

export function MyOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

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

  if (loading && orders.length === 0) return <LoadingScreen label="Загрузка заказов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📦 Мои заказы" showBack={false} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
              {driver?.full_name ?? user?.email} · 🚚 {driver?.car_number ?? 'без номера'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                onPress={() => navigation.navigate('DriverFinances')}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>💰 Финансы</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                onPress={() => navigation.navigate('Documents')}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>📑 Документы</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, backgroundColor: colors.textMuted, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                onPress={() => navigation.navigate('Reports')}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>📊 Отчёты</Text>
              </Pressable>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={screenUi.card}
            onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {item.contractor_name ?? 'Без контрагента'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              #{item.id} · {STATUS_LABEL[item.status]}
            </Text>
            {item.material ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.load_address ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>📍 {item.load_address}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>Заказов нет. Потяните список вниз, чтобы обновить.</Text>
        }
        ListFooterComponent={
          <MenuButton label="🚪 Выйти" onPress={onLogout} variant="danger" />
        }
      />
    </View>
  );
}
