import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton, Subtitle } from '../components/ui';
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
      { title: 'Общая задолженность', value: `${Math.round(totalDebt)} ₽`, color: '#ef4444' },
      { title: 'Новых уведомлений', value: String(unreadNotifications), color: '#7c3aed' },
    ],
    [activeOrders, driversOnline, totalDebt, unreadNotifications]
  );

  if (loading) return <LoadingScreen label="Загрузка дашборда…" />;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="🏠 Главная" showBack={false} />

      <View
        style={{
          backgroundColor: '#2563eb',
          borderRadius: 12,
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
          <Text style={{ color: '#bfdbfe', fontSize: 13, marginTop: 4 }}>👤 Администратор</Text>
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

      <View style={screenUi.card}>
        <Subtitle>📊 Сводка на сегодня</Subtitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {summaryCards.map((card) => (
            <View
              key={card.title}
              style={{
                width: '48%',
                backgroundColor: '#f9fafb',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                padding: 12,
              }}
            >
              <Text style={screenUi.sumLabel}>{card.title}</Text>
              <Text style={[screenUi.sumValue, { color: card.color }]}>{card.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={screenUi.card}>
        <Subtitle>⚡ Быстрые действия</Subtitle>
        <MenuButton label="➕ Создать заказ" onPress={() => navigation.navigate('OrderCreate')} />
        <MenuButton
          label="🔔 Уведомления"
          onPress={() => navigation.navigate('Notifications')}
          variant="secondary"
        />
      </View>

      <View style={screenUi.card}>
        <Subtitle>📂 Разделы</Subtitle>
        <MenuButton label="📦 Заказы — назначить задачи" onPress={() => navigation.replace('Orders')} />
        <MenuButton
          label="👤 Водители — список и машины"
          onPress={() => navigation.replace('Drivers')}
          variant="secondary"
        />
        <MenuButton
          label="💰 Контрагенты — заказчики"
          onPress={() => navigation.replace('Contractors')}
          variant="secondary"
        />
        <MenuButton
          label="💸 Расходы — топливо, ремонт"
          onPress={() => navigation.replace('Expenses')}
          variant="secondary"
        />
        <MenuButton
          label="📑 Реестр — все рейсы"
          onPress={() => navigation.replace('RegistryReport')}
          variant="secondary"
        />
        <MenuButton
          label="💼 Все финансы — отчёты, зарплата"
          onPress={() => navigation.replace('FinancesHub')}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}
