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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingScreen } from '../components/ui';
import { listDrivers } from '../api/drivers';
import { deleteOrder, listOrders, updateOrder } from '../api/orders';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { fetchCached, invalidateCache } from '../utils/apiCache';
import { STATUS_LABEL, type Driver, type Order } from '../types';

type OrdersTab = 'active' | 'archive';

const ORDERS_CACHE_KEY = 'admin:orders';
const DRIVERS_CACHE_KEY = 'admin:drivers';
const LIST_TTL_MS = 45_000;

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tab, setTab] = useState<OrdersTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilterId, setDriverFilterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      if (force) {
        invalidateCache('admin:');
      }
      const [orderData, driverData] = await Promise.all([
        fetchCached(ORDERS_CACHE_KEY, LIST_TTL_MS, () => listOrders({ limit: 300 })),
        fetchCached(DRIVERS_CACHE_KEY, LIST_TTL_MS, () => listDrivers()),
      ]);
      setOrders(orderData);
      setDrivers(driverData);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить задачи'));
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onDeleteOrder = (item: Order) => {
    Alert.alert('Удалить заказ?', `Заказ #${item.id} будет удалён безвозвратно`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrder(item.id);
            invalidateCache('admin:');
            invalidateCache('dashboard:');
            await load(true);
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить заказ'));
          }
        },
      },
    ]);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
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
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              pageTitle="📦 Заказы"
              title="Задачи"
              showBack
              onBack={() => navigation.navigate('AdminHome')}
              actionLabel="+ Создать"
              onAction={() => navigation.navigate('OrderCreate')}
            />

            <CollapsiblePanel
              title="Фильтры"
              subtitle={`Показано: ${filteredOrders.length} ${tab === 'active' ? 'активных' : 'архивных'} задач`}
              defaultExpanded
            >
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
                  placeholderTextColor={colors.textMuted}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={screenUi.filterLabel}>Водитель:</Text>
              <Pressable onPress={pickDriver} style={[screenUi.primaryPill, { marginBottom: 8 }]}>
                <Text style={screenUi.primaryPillText}>👥 {driverFilterLabel}</Text>
              </Pressable>
            </CollapsiblePanel>
          </View>
        }
        ListEmptyComponent={
          loading || refreshing ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
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
              tab === 'archive' && screenUi.archiveCard,
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
                <Text style={screenUi.cardTitleSm}>
                  {item.task_name || 'Без названия'}
                </Text>
                <Text style={screenUi.cardMeta}>#{item.id}</Text>
              </View>
              {tab === 'archive' ? (
                <View style={screenUi.archiveBadge}>
                  <Text style={screenUi.archiveBadgeText}>Архив</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  {STATUS_LABEL[item.status]}
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
              Заказчик: {item.contractor_name ?? '—'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 4 }}>
              Материал: {item.material ?? '—'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
              📍 {item.load_address ?? '—'} → {item.unload_address ?? '—'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
              👤 Водитель: {item.driver_name ?? '—'}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Text>

            <View style={[screenUi.dividerTop, screenUi.actionRow]}>
              {tab === 'archive' ? (
                <>
                  <Pressable
                    onPress={() => toggleArchive(item, true)}
                    style={[screenUi.actionBtn, { backgroundColor: colors.profit }]}
                  >
                    <Text style={screenUi.actionBtnText}>Восстановить</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDeleteOrder(item)}
                    style={[screenUi.actionBtn, { backgroundColor: colors.loss }]}
                  >
                    <Text style={screenUi.actionBtnText}>Удалить</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => toggleArchive(item, false)}
                  style={[screenUi.actionBtn, { backgroundColor: colors.textMuted }]}
                >
                  <Text style={screenUi.actionBtnText}>В архив</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
                style={[screenUi.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={screenUi.actionBtnText}>Открыть</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('OrderEdit', { id: item.id })}
                style={[screenUi.actionBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={screenUi.actionBtnText}>Изменить</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
