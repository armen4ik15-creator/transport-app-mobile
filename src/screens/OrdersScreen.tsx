import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderCreateModal } from '../components/orders/OrderCreateModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { LoadingScreen } from '../components/ui';
import { listDrivers } from '../api/drivers';
import { listOrders, updateOrder } from '../api/orders';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import { STATUS_LABEL, type Driver, type Order } from '../types';

type OrdersTab = 'active' | 'archive';

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tab, setTab] = useState<OrdersTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilterId, setDriverFilterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orderData, driverData] = await Promise.all([
        withFallback(() => listOrders(), []),
        withFallback(() => listDrivers(), []),
      ]);
      setOrders(orderData);
      setDrivers(driverData);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить задачи'));
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

  const activeOrders = useMemo(
    () => orders.filter((item) => Boolean(item.is_active)),
    [orders]
  );
  const archivedOrders = useMemo(
    () => orders.filter((item) => !Boolean(item.is_active)),
    [orders]
  );
  const tabOrders = tab === 'active' ? activeOrders : archivedOrders;

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tabOrders.filter((item) => {
      if (driverFilterId != null && item.driver_id !== driverFilterId) return false;
      if (!query) return true;
      const haystack = [
        item.task_name,
        item.contractor_name,
        item.material,
        item.load_address,
        item.unload_address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [driverFilterId, searchQuery, tabOrders]);

  const driverFilterLabel = useMemo(() => {
    if (driverFilterId == null) return 'Все';
    const driver = drivers.find((item) => item.id === driverFilterId);
    return driver?.full_name ?? driver?.email ?? 'Водитель';
  }, [driverFilterId, drivers]);

  const pickDriver = () => {
    Alert.alert('Водитель', undefined, [
      {
        text: '👥 Все',
        onPress: () => setDriverFilterId(null),
      },
      ...drivers.map((driver) => ({
        text: driver.full_name ?? driver.email,
        onPress: () => setDriverFilterId(driver.id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const toggleArchive = async (order: Order, makeActive: boolean) => {
    try {
      await updateOrder(order.id, { is_active: makeActive });
      await load();
      Alert.alert('Готово', makeActive ? 'Задача восстановлена' : 'Задача перенесена в архив');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось обновить задачу'));
    }
  };

  if (loading && orders.length === 0) {
    return <LoadingScreen label="Загрузка задач…" />;
  }

  return (
    <View style={screenUi.container}>
      <View style={screenUi.content}>
        <ScreenHeader
          pageTitle="📦 Заказы"
          title="Задачи"
          showBack
          onBack={() => navigation.replace('AdminHome')}
          actionLabel="+ Создать"
          onAction={() => setCreateVisible(true)}
        />
        <ScreenHero
          title="📦 Заказы и задачи"
          subtitle={`Активных: ${activeOrders.length} · В архиве: ${archivedOrders.length}`}
        />

        <View style={screenUi.tabs}>
          <Pressable
            style={[screenUi.tabBtn, tab === 'active' && screenUi.tabBtnActive]}
            onPress={() => setTab('active')}
          >
            <Text style={[screenUi.tabBtnText, tab === 'active' && screenUi.tabBtnTextActive]}>
              ✅ Активные ({activeOrders.length})
            </Text>
          </Pressable>
          <Pressable
            style={[screenUi.tabBtn, tab === 'archive' && screenUi.tabBtnActive]}
            onPress={() => setTab('archive')}
          >
            <Text style={[screenUi.tabBtnText, tab === 'archive' && screenUi.tabBtnTextActive]}>
              📦 Архив ({archivedOrders.length})
            </Text>
          </Pressable>
        </View>

        <View style={screenUi.searchContainer}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={screenUi.searchInput}
            placeholder="Поиск по заказчику, материалу..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 16, color: '#9ca3af' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={screenUi.filterLabel}>Водитель:</Text>
        <Pressable
          onPress={pickDriver}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#2563eb',
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
            👥 {driverFilterLabel}
          </Text>
        </Pressable>

        <Text style={screenUi.countLabel}>
          Показано: {filteredOrders.length}{' '}
          {tab === 'active' ? 'активных' : 'архивных'} задач
        </Text>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading || refreshing ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : (
            <Text style={screenUi.emptyText}>
              {tab === 'active'
                ? 'Нет активных задач. Создайте задачу кнопкой "+ Создать"'
                : 'Архив пуст'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View
            style={[
              screenUi.card,
              tab === 'archive' && { backgroundColor: '#fafafa', borderColor: '#e5e7eb' },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                  {item.task_name || 'Без названия'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>#{item.id}</Text>
              </View>
              {tab === 'archive' ? (
                <View
                  style={{
                    backgroundColor: '#fef3c7',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>Архив</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }}>
                  {STATUS_LABEL[item.status]}
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 14, color: '#1f2937', marginBottom: 4 }}>
              Заказчик: {item.contractor_name ?? '—'}
            </Text>
            <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              Материал: {item.material ?? '—'}
            </Text>
            <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 8 }}>
              📍 {item.load_address ?? '—'} → {item.unload_address ?? '—'}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              👤 Водитель: {item.driver_name ?? '—'}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
                paddingTop: 10,
              }}
            >
              {tab === 'archive' ? (
                <Pressable
                  onPress={() => toggleArchive(item, true)}
                  style={{
                    flex: 1,
                    backgroundColor: '#16a34a',
                    paddingVertical: 8,
                    borderRadius: 7,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                    Восстановить
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => toggleArchive(item, false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#6b7280',
                    paddingVertical: 8,
                    borderRadius: 7,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                    В архив
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
                style={{
                  flex: 1,
                  backgroundColor: '#2563eb',
                  paddingVertical: 8,
                  borderRadius: 7,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Открыть</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('OrderEdit', { id: item.id })}
                style={{
                  flex: 1,
                  backgroundColor: '#7c3aed',
                  paddingVertical: 8,
                  borderRadius: 7,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Изменить</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <OrderCreateModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={load}
      />
    </View>
  );
}
