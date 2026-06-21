import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecentOrderRow } from '../components/dashboard/RecentOrderRow';
import { StatSummaryCard } from '../components/dashboard/StatSummaryCard';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import { SectionTitle } from '../components/ui-kit';
import { ErrorText } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { Order } from '../types';
import { getDashboardStats } from '../api/dashboard';
import { listDrivers } from '../api/drivers';
import { listOrders } from '../api/orders';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { fetchCached, invalidateCache } from '../utils/apiCache';
import { screenUi } from '../styles/screenUi';
import { colors, spacing } from '../theme';

const DASHBOARD_CACHE_KEY = 'dashboard:stats';
const DASHBOARD_TTL_MS = 45_000;
const REQUEST_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Превышено время ожидания сервера')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function loadDashboardStats() {
  try {
    return await withTimeout(getDashboardStats(), REQUEST_TIMEOUT_MS);
  } catch {
    const [orders, drivers, debts, notifications] = await withTimeout(
      Promise.all([
        listOrders({ limit: 100 }),
        listDrivers(),
        getContractorDebtSummary(),
        listNotifications(),
      ]),
      REQUEST_TIMEOUT_MS
    );
    return {
      active_orders: orders.filter((o) => Boolean(o.is_active)).length,
      drivers_online: drivers.filter((d) => Boolean(d.is_active)).length,
      unread_notifications: notifications.filter((item) => !item.read).length,
      total_debt: debts.reduce((sum, item) => sum + item.debt, 0),
      recent_orders: orders.slice(0, 5),
    };
  }
}

export function AdminHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut, clearNetworkIssue } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyStats = useCallback((stats: Awaited<ReturnType<typeof getDashboardStats>>) => {
    setActiveOrders(stats.active_orders);
    setDriversOnline(stats.drivers_online);
    setTotalDebt(stats.total_debt);
    setUnreadNotifications(stats.unread_notifications);
    setRecentOrders(stats.recent_orders);
  }, []);

  const loadDashboard = useCallback(
    async (force = false) => {
      try {
        setError(null);
        if (force) invalidateCache('dashboard:');
        const stats = await fetchCached(DASHBOARD_CACHE_KEY, DASHBOARD_TTL_MS, loadDashboardStats);
        applyStats(stats);
        clearNetworkIssue();
      } catch (e) {
        setError(apiErrorMessage(e, 'Не удалось загрузить дашборд'));
      }
    },
    [applyStats, clearNetworkIssue]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setRefreshing(false);
  };

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const companyTitle = useMemo(
    () => user?.full_name?.trim() || 'ReestrPro',
    [user?.full_name]
  );

  const quickItems: QuickAccessItem[] = [
    { icon: '➕', title: 'Новый заказ', color: colors.primary, onPress: () => navigation.navigate('OrderCreate') },
    { icon: '📦', title: 'Заказы', color: colors.primary, onPress: () => navigation.navigate('Orders') },
    { icon: '👤', title: 'Водители', color: colors.profit, onPress: () => navigation.navigate('Drivers') },
    { icon: '🏢', title: 'Контрагенты', color: colors.warning, onPress: () => navigation.navigate('Contractors') },
    { icon: '📑', title: 'Реестр', color: colors.accent, onPress: () => navigation.navigate('RegistryReport') },
    { icon: '💼', title: 'Финансы', color: colors.primary, onPress: () => navigation.navigate('FinancesHub') },
    { icon: '🔔', title: 'Уведомления', color: colors.warning, onPress: () => navigation.navigate('Notifications') },
    { icon: '💸', title: 'Расходы', color: colors.loss, onPress: () => navigation.navigate('Expenses') },
  ];

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Главная</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 }}>{companyTitle}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{user?.email ?? ''}</Text>
        </View>
        <Pressable
          onPress={onLogout}
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.loss, fontWeight: '600', fontSize: 13 }}>Выйти</Text>
        </Pressable>
      </View>

      {refreshing ? (
        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <ErrorText message={error} />

      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>Сводка</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <StatSummaryCard
          label="Активные заказы"
          value={String(activeOrders)}
          accentColor={colors.primary}
          icon="📦"
          tone="info"
          onPress={() => navigation.navigate('Orders')}
        />
        <StatSummaryCard
          label="Водителей на линии"
          value={String(driversOnline)}
          accentColor={colors.profit}
          icon="👤"
          tone="positive"
          onPress={() => navigation.navigate('Drivers')}
        />
        <StatSummaryCard
          label="Задолженность"
          value={`${Math.round(totalDebt).toLocaleString('ru-RU')} ₽`}
          accentColor={colors.warning}
          icon="💰"
          tone="warning"
          onPress={() => navigation.navigate('Contractors')}
        />
        <StatSummaryCard
          label="Уведомления"
          value={String(unreadNotifications)}
          accentColor={colors.accent}
          icon="🔔"
          tone="danger"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      <SectionTitle>Быстрый доступ</SectionTitle>
      <QuickAccessGrid items={quickItems} />

      <SectionTitle
        action={
          <Pressable onPress={() => navigation.navigate('Orders')}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Все →</Text>
          </Pressable>
        }
      >
        Последние заказы
      </SectionTitle>
      {recentOrders.length === 0 ? (
        <Text style={screenUi.emptyText}>{error ? 'Данные недоступны. Потяните вниз для обновления.' : 'Нет заказов'}</Text>
      ) : (
        recentOrders.map((order) => (
          <RecentOrderRow
            key={order.id}
            order={order}
            onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
          />
        ))
      )}
    </ScrollView>
  );
}
