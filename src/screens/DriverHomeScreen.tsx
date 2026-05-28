import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, ErrorText, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listOrders } from '../api/orders';
import { getEarningsSummary } from '../api/earnings';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
import { withFallback } from '../utils/safeRequest';

export function DriverHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, driver, signOut } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
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
      { title: 'Активные заказы', value: String(activeOrders) },
      { title: 'Мой заработок (оценка)', value: `${Math.round(estimatedIncome)} ₽` },
      { title: 'Новые уведомления', value: String(unreadNotifications) },
    ],
    [activeOrders, estimatedIncome, unreadNotifications]
  );

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title>Главная</Title>

      <View
        style={{
          backgroundColor: '#0d3d7a',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
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
            {driver?.car_number ? `Водитель · ${driver.car_number}` : 'Водитель'}
          </Text>
        </View>
        <Pressable
          onPress={onLogout}
          style={{
            backgroundColor: '#c01c28',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Выйти</Text>
        </Pressable>
      </View>

      <ErrorText message={error} />

      <Card>
        <Subtitle>Сегодня</Subtitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {cards.map((card) => (
            <View
              key={card.title}
              style={{
                width: '48%',
                backgroundColor: '#f8fafc',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                padding: 12,
              }}
            >
              <Subtitle>{card.title}</Subtitle>
              <Title>{card.value}</Title>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Subtitle>Разделы</Subtitle>
        <MenuButton label="📦 Мои заказы" onPress={() => navigation.replace('DriverOrders')} />
        <MenuButton label="💼 Мои финансы" onPress={() => navigation.replace('DriverFinancesHub')} variant="secondary" />
        <MenuButton label="🔔 Уведомления" onPress={() => navigation.navigate('Notifications')} variant="secondary" />
      </Card>
    </ScrollView>
  );
}
