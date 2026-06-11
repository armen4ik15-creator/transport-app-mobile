import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen, Subtitle } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';

export function AdminHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [orders, drivers, debts, notifications] = await Promise.all([
        withFallback(() => listOrders(), []),
        withFallback(() => listDrivers(), []),
        withFallback(() => getContractorDebtSummary(), []),
        withFallback(() => listNotifications(), []),
      ]);
      setActiveOrders(orders.filter((o) => Boolean(o.is_active)).length);
      setDriversOnline(drivers.filter((d) => Boolean(d.is_active)).length);
      setTotalDebt(debts.reduce((sum, item) => sum + item.debt, 0));
      setUnreadNotifications(notifications.filter((item) => !item.read).length);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить дашборд'));
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

  const summaryCards = useMemo(
    () => [
      { title: 'Активные заказы', value: String(activeOrders), color: '#2563eb' },
      { title: 'Водителей на линии', value: String(driversOnline), color: '#16a34a' },
      { title: 'Задолженность', value: `${Math.round(totalDebt)} ₽`, color: '#ef4444' },
      { title: 'Уведомления', value: String(unreadNotifications), color: '#7c3aed' },
    ],
    [activeOrders, driversOnline, totalDebt, unreadNotifications]
  );

  const quickItems: QuickAccessItem[] = [
    { icon: '➕', title: 'Новый заказ', color: '#2563eb', onPress: () => navigation.navigate('OrderCreate') },
    { icon: '📦', title: 'Заказы', color: '#0891b2', onPress: () => navigation.replace('Orders') },
    { icon: '👤', title: 'Водители', color: '#16a34a', onPress: () => navigation.replace('Drivers') },
    { icon: '🏢', title: 'Контрагенты', color: '#f59e0b', onPress: () => navigation.replace('Contractors') },
    { icon: '📑', title: 'Реестр', color: '#7c3aed', onPress: () => navigation.replace('RegistryReport') },
    { icon: '💼', title: 'Финансы', color: '#6366f1', onPress: () => navigation.replace('FinancesHub') },
    { icon: '🔔', title: 'Уведомления', color: '#ea580c', onPress: () => navigation.navigate('Notifications') },
    { icon: '💸', title: 'Расходы', color: '#ef4444', onPress: () => navigation.replace('Expenses') },
  ];

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="🏠 Главная" showBack={false} />

      <ScreenHero
        title="Добро пожаловать!"
        subtitle={`${user?.email ?? ''} · 👤 Администратор`}
        style={{ marginBottom: 10 }}
      />
      <Pressable
        onPress={onLogout}
        style={{
          alignSelf: 'flex-end',
          backgroundColor: '#ef4444',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginBottom: 14,
          marginTop: -8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Выйти</Text>
      </Pressable>

      <ErrorText message={error} />

      <View style={screenUi.card}>
        <Subtitle>📊 Сводка</Subtitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {summaryCards.map((card) => (
            <View
              key={card.title}
              style={{
                width: '48%',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderLeftWidth: 4,
                borderLeftColor: card.color,
                padding: 12,
              }}
            >
              <Text style={screenUi.sumLabel}>{card.title}</Text>
              <Text style={[screenUi.sumValue, { color: card.color }]}>{card.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 }}>⚡ Быстрый доступ</Text>
      <QuickAccessGrid items={quickItems} />
    </ScrollView>
  );
}
