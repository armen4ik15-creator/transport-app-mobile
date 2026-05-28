import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, ErrorText, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';
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
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>{user?.email}</Text>
          <Text style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4 }}>Администратор</Text>
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
        <MenuButton label="🔔 Уведомления" onPress={() => navigation.navigate('Notifications')} variant="secondary" />
      </Card>

      <Card>
        <Subtitle>Разделы</Subtitle>
        <MenuButton label="📦 Заказы — назначить задачи" onPress={() => navigation.replace('Orders')} />
        <MenuButton label="👤 Водители — список и машины" onPress={() => navigation.replace('Drivers')} variant="secondary" />
        <MenuButton label="💰 Контрагенты — заказчики" onPress={() => navigation.replace('Contractors')} variant="secondary" />
        <MenuButton label="💸 Расходы — топливо, ремонт" onPress={() => navigation.replace('Expenses')} variant="secondary" />
        <MenuButton label="📑 Реестр — все рейсы" onPress={() => navigation.replace('RegistryReport')} variant="secondary" />
        <MenuButton label="💼 Все финансы — отчёты, зарплата" onPress={() => navigation.replace('FinancesHub')} variant="secondary" />
      </Card>
    </ScrollView>
  );
}
