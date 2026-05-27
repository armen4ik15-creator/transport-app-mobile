import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, ErrorText, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listOrders } from '../api/orders';
import { getEarningsSummary } from '../api/earnings';
import { listNotifications } from '../api/notifications';
import { apiErrorMessage } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverHome'>;

export function DriverHomeScreen({ navigation }: Props) {
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
        listOrders(),
        getEarningsSummary({ from, to }),
        listNotifications(),
      ]);
      setActiveOrders(orders.filter((item) => Boolean(item.is_active)).length);
      setEstimatedIncome(earnings.estimated_income);
      setUnreadNotifications(notifications.filter((item) => !item.read).length);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить дашборд водителя'));
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
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Title>Меню водителя</Title>
      <Subtitle>
        {driver?.full_name || user?.full_name || user?.email}
        {driver?.car_number ? ` · ${driver.car_number}` : ''}
      </Subtitle>
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
        <Subtitle>Быстрые действия</Subtitle>
        <MenuButton label="📦 Открыть мои заказы" onPress={() => navigation.navigate('DriverOrders')} />
        <MenuButton label="🧾 Загрузка / Разгрузка" onPress={() => navigation.navigate('DriverOrders')} variant="secondary" />
        <MenuButton label="💰 Открыть мои финансы" onPress={() => navigation.navigate('Finances')} variant="secondary" />
      </Card>
      <MenuButton
        label="Выйти"
        onPress={() =>
          Alert.alert('Выход', 'Выйти из аккаунта?', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
          ])
        }
        variant="danger"
      />
    </ScrollView>
  );
}
