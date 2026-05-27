import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, ErrorText, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;

export function AdminHomeScreen({ navigation }: Props) {
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
        listOrders(),
        listDrivers(),
        getContractorDebtSummary(),
        listNotifications(),
      ]);
      setActiveOrders(orders.filter((o) => Boolean(o.is_active)).length);
      setDriversOnline(drivers.filter((d) => Boolean(d.is_active)).length);
      setTotalDebt(debts.reduce((sum, item) => sum + item.debt, 0));
      setUnreadNotifications(notifications.filter((item) => !item.read).length);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить дашборд'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard().finally(() => setLoading(false));
    }, [loadDashboard])
  );

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
      { title: 'Активные заказы', value: String(activeOrders) },
      { title: 'Водителей на линии', value: String(driversOnline) },
      { title: 'Общая задолженность', value: `${Math.round(totalDebt)} ₽` },
      { title: 'Новых уведомлений', value: String(unreadNotifications) },
    ],
    [activeOrders, driversOnline, totalDebt, unreadNotifications]
  );

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title>Меню администратора</Title>
      <Subtitle>{user?.email}</Subtitle>
      <ErrorText message={error} />

      <Card>
        <Subtitle>Сводка на сегодня</Subtitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {summaryCards.map((card) => (
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
        <Subtitle>Быстрые действия</Subtitle>
        <MenuButton label="➕ Создать заказ" onPress={() => navigation.navigate('OrderCreate')} />
        <MenuButton label="👤 Добавить водителя" onPress={() => navigation.navigate('Drivers')} />
        <MenuButton label="📋 Все заказы" onPress={() => navigation.navigate('Orders')} variant="secondary" />
        <MenuButton label="🔔 Открыть уведомления" onPress={() => navigation.navigate('Notifications')} variant="secondary" />
      </Card>

      <MenuButton label="Выйти" onPress={onLogout} variant="danger" />
    </ScrollView>
  );
}
