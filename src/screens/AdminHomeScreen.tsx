import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import {
  AppHeader,
  DonutChart,
  ListRow,
  OptiSyncBanner,
  PnLCard,
  SectionLabel,
  StatCard,
  StatusPill,
  rub,
  type DonutSlice,
} from '../components/kit';
import { ErrorText } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { Order } from '../types';
import { getDashboardStats } from '../api/dashboard';
import { listExpenses } from '../api/expenses';
import { getReportDaily } from '../api/reports';
import { listDrivers } from '../api/drivers';
import { listOrders } from '../api/orders';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { ALL_EXPENSE_TYPES } from '../constants/expenseTypes';
import { fetchCached, invalidateCache } from '../utils/apiCache';
import { initialsFromName, trendPercent } from '../utils/format';
import { screenUi } from '../styles/screenUi';
import { colors, radii, spacing } from '../theme';

const DASHBOARD_CACHE_KEY = 'dashboard:stats';
const REPORT_CACHE_KEY = 'dashboard:report-daily';
const EXPENSES_CACHE_KEY = 'dashboard:expenses-month';
const DASHBOARD_TTL_MS = 45_000;
const REQUEST_TIMEOUT_MS = 12_000;
const CHART_COLORS = [colors.primary, colors.profit, colors.warning, colors.loss, colors.accent];

const expenseLabel = new Map(ALL_EXPENSE_TYPES.map((t) => [t.value, t.label]));

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

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function AdminHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut, clearNetworkIssue } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [todayPnL, setTodayPnL] = useState({ profit: 0, revenue: 0, expenses: 0, trend: null as number | null });
  const [monthPnL, setMonthPnL] = useState({ profit: 0, revenue: 0, expenses: 0, trend: null as number | null });
  const [donutSlices, setDonutSlices] = useState<DonutSlice[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (force = false) => {
      try {
        setError(null);
        if (force) invalidateCache('dashboard:');
        const from = monthStartIso();
        const to = todayIso();
        const [stats, report, expenses] = await Promise.all([
          fetchCached(DASHBOARD_CACHE_KEY, DASHBOARD_TTL_MS, loadDashboardStats),
          fetchCached(REPORT_CACHE_KEY, DASHBOARD_TTL_MS, () =>
            withTimeout(getReportDaily({ from, to }), REQUEST_TIMEOUT_MS)
          ).catch(() => null),
          fetchCached(EXPENSES_CACHE_KEY, DASHBOARD_TTL_MS, () =>
            withTimeout(listExpenses({ from, to }), REQUEST_TIMEOUT_MS)
          ).catch(() => []),
        ]);

        setActiveOrders(stats.active_orders);
        setDriversOnline(stats.drivers_online);
        setTotalDebt(stats.total_debt);
        setUnreadNotifications(stats.unread_notifications);
        setRecentOrders(stats.recent_orders);

        if (report) {
          const todayRow = report.days.find((d) => d.date === to);
          const yesterdayRow = report.days.find((d) => d.date === yesterdayIso());
          const todayProfit = todayRow?.profit ?? 0;
          const mid = Math.max(1, Math.floor(report.days.length / 2));
          const firstHalf = report.days.slice(0, mid).reduce((s, d) => s + d.profit, 0);
          const secondHalf = report.days.slice(mid).reduce((s, d) => s + d.profit, 0);

          setTodayPnL({
            profit: todayProfit,
            revenue: todayRow?.revenue ?? 0,
            expenses: todayRow?.costs ?? 0,
            trend: trendPercent(todayProfit, yesterdayRow?.profit ?? 0),
          });
          setMonthPnL({
            profit: report.totals.profit,
            revenue: report.totals.revenue,
            expenses: report.totals.costs,
            trend: trendPercent(secondHalf, firstHalf),
          });
        }

        const approved = expenses.filter((e) => !e.status || e.status === 'approved');
        const byType = new Map<string, number>();
        for (const e of approved) {
          const key = e.exp_type ?? 'other';
          byType.set(key, (byType.get(key) ?? 0) + e.amount);
        }
        const slices = Array.from(byType.entries())
          .map(([type, value], i) => ({
            label: expenseLabel.get(type) ?? type,
            value,
            color: CHART_COLORS[i % CHART_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setDonutSlices(slices);
        setExpenseTotal(approved.reduce((s, e) => s + e.amount, 0));

        clearNetworkIssue();
      } catch (e) {
        setError(apiErrorMessage(e, 'Не удалось загрузить дашборд'));
      }
    },
    [clearNetworkIssue]
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

  const companyTitle = useMemo(() => user?.full_name?.trim() || 'ReestrPro', [user?.full_name]);

  const quickItems: QuickAccessItem[] = [
    { icon: '+', title: 'Новый заказ', color: colors.primary, onPress: () => navigation.navigate('OrderCreate') },
    { icon: '📦', title: 'Заказы', color: colors.primary, onPress: () => navigation.navigate('Orders') },
    { icon: '👤', title: 'Водители', color: colors.profit, onPress: () => navigation.navigate('Drivers') },
    { icon: '🏢', title: 'Контраг.', color: colors.textMuted, onPress: () => navigation.navigate('Contractors') },
    { icon: 'ℹ️', title: 'О приложении', color: colors.textMuted, onPress: () => navigation.navigate('About') },
  ];

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppHeader
        title="Дашборд"
        subtitle={`${companyTitle} · Администратор`}
        initials={initialsFromName(user?.full_name ?? user?.email)}
        notifications={unreadNotifications}
        onNotifications={() => navigation.navigate('Notifications')}
        onLogout={onLogout}
      />

      <ErrorText message={error} />
      <OptiSyncBanner />

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <PnLCard label="Сегодня" {...todayPnL} />
        <PnLCard label="За месяц" {...monthPnL} />
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Структура расходов</Text>
          <Pressable onPress={() => navigation.navigate('Expenses')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.primaryLight }}>Все </Text>
            <Text style={{ color: colors.primaryLight }}>→</Text>
          </Pressable>
        </View>
        <DonutChart data={donutSlices} total={expenseTotal} />
      </View>

      <SectionLabel>Сводка</SectionLabel>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        <StatCard icon="package" iconColor={colors.primaryLight} label="Активные заказы" value={String(activeOrders)} valueColor={colors.primaryLight} onPress={() => navigation.navigate('Orders')} />
        <StatCard icon="users" iconColor={colors.profit} label="Водителей на линии" value={String(driversOnline)} valueColor={colors.profit} onPress={() => navigation.navigate('Drivers')} />
        <StatCard icon="credit-card" iconColor={colors.warning} label="Задолженность" value={rub(totalDebt)} valueColor={colors.warning} onPress={() => navigation.navigate('Contractors')} />
        <StatCard icon="bell" iconColor={colors.accent} label="Уведомления" value={String(unreadNotifications)} onPress={() => navigation.navigate('Notifications')} />
      </View>

      <SectionLabel>Быстрый доступ</SectionLabel>
      <QuickAccessGrid items={quickItems} />

      <SectionLabel
        action={
          <Pressable onPress={() => navigation.navigate('Orders')}>
            <Text style={{ fontSize: 14, color: colors.primaryLight }}>Все →</Text>
          </Pressable>
        }
      >
        Последние заказы
      </SectionLabel>
      {recentOrders.length === 0 ? (
        <Text style={screenUi.emptyText}>{error ? 'Потяните вниз для обновления' : 'Нет заказов'}</Text>
      ) : (
        recentOrders.slice(0, 2).map((order) => (
          <ListRow
            key={order.id}
            icon="package"
            title={`${order.contractor_name ?? 'Контрагент'} · ${order.material ?? order.task_name ?? 'Груз'}`}
            subtitle={`#${order.id} · ${order.load_address ?? '—'} → ${order.unload_address ?? '—'}`}
            trailing={<StatusPill label={order.is_active ? 'Активно' : 'Завершён'} tone={order.is_active ? 'active' : 'muted'} />}
            onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
          />
        ))
      )}
    </ScrollView>
  );
}
