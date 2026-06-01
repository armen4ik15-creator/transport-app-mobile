import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { DriverTripActionCard } from '../components/DriverTripActionCard';
import { QuickAccessGrid, type QuickAccessItem } from '../components/QuickAccessGrid';
import { ErrorText, LoadingScreen } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listOrders } from '../api/orders';
import { getEarningsSummary } from '../api/earnings';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
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

  const cards = useMemo(
    () => [
      { title: 'Активные заказы', value: String(activeOrders), color: '#2563eb' },
      { title: 'Мой заработок (рейсы)', value: `${Math.round(estimatedIncome)} ₽`, color: '#16a34a' },
      { title: 'Новые уведомления', value: String(unreadNotifications), color: '#7c3aed' },
    ],
    [activeOrders, estimatedIncome, unreadNotifications]
  );

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  const quickItems: QuickAccessItem[] = [
    { icon: '📦', title: 'Мои заказы', color: '#2563eb', onPress: () => navigation.replace('DriverOrders') },
    { icon: '💼', title: 'Мои финансы', color: '#16a34a', onPress: () => navigation.replace('DriverFinancesHub') },
    { icon: '🔔', title: 'Уведомления', color: '#7c3aed', onPress: () => navigation.navigate('Notifications') },
  ];

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="🏠 Главная" showBack={false} />

      <View
        style={{
          backgroundColor: '#1e3a5f',
          borderRadius: 14,
          padding: 18,
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: '#dbeafe', fontSize: 13, marginBottom: 4 }}>Добро пожаловать!</Text>
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
            {driver?.full_name || user?.full_name || user?.email}
          </Text>
          <Text style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4 }}>
            🚛 {driver?.car_number ? `Водитель · ${driver.car_number}` : 'Водитель'}
          </Text>
        </View>
        <Pressable
          onPress={onLogout}
          style={{
            backgroundColor: '#ef4444',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Выйти</Text>
        </Pressable>
      </View>

      <ErrorText message={error} />

      {primaryOrder ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
            🎯 Ваша задача сейчас
          </Text>
          <DriverTripActionCard
            orderId={primaryOrder.id}
            taskLabel={
              primaryOrder.task_name ||
              [primaryOrder.material, primaryOrder.load_address].filter(Boolean).join(' · ') ||
              undefined
            }
          />
          <Pressable
            onPress={() => navigation.navigate('OrderDetail', { id: primaryOrder.id })}
            style={{ paddingVertical: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#6b7280', fontSize: 13 }}>ℹ️ Подробнее о заказе</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[screenUi.card, { marginBottom: 12 }]}>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
            Активных заказов нет. Новые задачи появятся в «Мои заказы».
          </Text>
        </View>
      )}

      <View style={screenUi.card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 }}>📊 Сегодня</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {cards.map((card) => (
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

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10, marginTop: 4 }}>
        📂 Разделы
      </Text>
      <QuickAccessGrid items={quickItems} />
    </ScrollView>
  );
}
