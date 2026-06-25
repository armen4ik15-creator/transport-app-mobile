import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DriverTripActionCard } from '../components/DriverTripActionCard';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import {
  AppHeader,
  DriverTaskStepper,
  KitIcon,
  SectionLabel,
  StatCard,
  rub,
} from '../components/kit';
import { ErrorText, LoadingScreen } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listOrders } from '../api/orders';
import { getEarningsSummary } from '../api/earnings';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import { colors, radii, spacing } from '../theme';
import { initialsFromName } from '../utils/format';
import { withFallback } from '../utils/safeRequest';
import type { Order } from '../types';

export function DriverHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, driver, signOut } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [primaryOrder, setPrimaryOrder] = useState<Order | null>(null);
  const [estimatedIncome, setEstimatedIncome] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const from = `${today.getFullYear()}-${month}-01`;
      const to = today.toISOString().slice(0, 10);
      const [orders, earnings, notifications] = await Promise.all([
        withFallback(() => listOrders(), []),
        withFallback(() => getEarningsSummary({ from, to }), {
          total_trips: 0,
          total_volume: 0,
          estimated_income: 0,
          actual_income: 0,
          actual_expense: 0,
          actual_balance: 0,
        }),
        withFallback(() => listNotifications(), []),
      ]);
      setActiveOrders(orders.filter((item) => Boolean(item.is_active)).length);
      setPrimaryOrder(orders.find((item) => Boolean(item.is_active)) ?? null);
      setEstimatedIncome(earnings.estimated_income);
      setUnreadNotifications(notifications.filter((item) => !item.read).length);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить дашборд водителя'));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const displayName = useMemo(
    () => driver?.full_name || user?.full_name || user?.email || 'Водитель',
    [driver?.full_name, user?.email, user?.full_name]
  );

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  const quickItems: QuickAccessItem[] = [
    { icon: '📦', title: 'Мои заказы', color: colors.primary, onPress: () => navigation.replace('DriverOrders') },
    { icon: '💼', title: 'Мои финансы', color: colors.profit, onPress: () => navigation.replace('DriverFinancesHub') },
    { icon: '🔔', title: 'Уведомления', color: colors.accent, onPress: () => navigation.navigate('Notifications') },
  ];

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <AppHeader
        title={displayName}
        subtitle={driver?.car_number ? `Водитель · ${driver.car_number}` : 'Водитель'}
        initials={initialsFromName(displayName)}
        notifications={unreadNotifications}
        onNotifications={() => navigation.navigate('Notifications')}
        onLogout={onLogout}
      />

      <ErrorText message={error} />

      {primaryOrder ? (
        <>
          <SectionLabel>Ваша задача сейчас</SectionLabel>
          <View
            style={{
              borderWidth: 2,
              borderColor: `${colors.primary}99`,
              backgroundColor: colors.primaryMuted,
              borderRadius: radii.lg,
              padding: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <KitIcon name="truck" color={colors.primaryLight} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                Рейс по заказу #{primaryOrder.id}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              Шаг 1 из 3: отметьте прибытие на погрузку
            </Text>
            <DriverTaskStepper activeStep={0} />
            <DriverTripActionCard
              orderId={primaryOrder.id}
              taskLabel={
                primaryOrder.task_name ||
                [primaryOrder.material, primaryOrder.load_address].filter(Boolean).join(' · ') ||
                undefined
              }
            />
          </View>
          <Pressable
            onPress={() => navigation.navigate('OrderDetail', { id: primaryOrder.id })}
            style={{ alignItems: 'center', marginBottom: spacing.md }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.primaryLight }}>Подробнее о заказе</Text>
          </Pressable>
        </>
      ) : (
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
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
            Активных заказов нет. Новые задачи появятся в «Мои заказы».
          </Text>
        </View>
      )}

      <SectionLabel>Сегодня</SectionLabel>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        <StatCard icon="package" label="Активные заказы" value={String(activeOrders)} valueColor={colors.primaryLight} onPress={() => navigation.replace('DriverOrders')} />
        <StatCard icon="dollar-sign" label="Заработок" value={rub(estimatedIncome)} valueColor={colors.profit} />
        <StatCard icon="bell" label="Уведомления" value={String(unreadNotifications)} />
      </View>

      <SectionLabel>Разделы</SectionLabel>
      <QuickAccessGrid items={quickItems} />
    </ScrollView>
  );
}
