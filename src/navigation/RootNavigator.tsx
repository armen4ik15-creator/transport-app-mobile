import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components/ui';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { DriversScreen } from '../screens/DriversScreen';
import { ContractorsScreen } from '../screens/ContractorsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderCreateScreen } from '../screens/OrderCreateScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { DriverOrdersScreen } from '../screens/DriverOrdersScreen';
import { AdminFinancesScreen } from '../screens/AdminFinancesScreen';
import { DriverFinancesScreen } from '../screens/DriverFinancesScreen';
import { FinancesScreen } from '../screens/FinancesScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ServerSetupScreen } from '../screens/ServerSetupScreen';
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { getServerUrl, setServerIssueHandler } from '../api/client';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminHome: undefined;
  Drivers: undefined;
  Contractors: undefined;
  Orders: undefined;
  OrderCreate: undefined;
  OrderDetail: { id: number };
  MyOrders: undefined;
  DriverHome: undefined;
  DriverOrders: undefined;
  Finances: undefined;
  AdminFinances: undefined;
  DriverFinances: undefined;
  Documents: undefined;
  Reports: undefined;
  ServerSetup: { reason?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [serverIssue, setServerIssue] = useState(false);

  const checkServerConfigured = useCallback(async () => {
    const url = await getServerUrl();
    setServerReady(Boolean(url));
  }, []);

  useEffect(() => {
    checkServerConfigured();
  }, [checkServerConfigured]);

  useEffect(() => {
    setServerIssueHandler(() => {
      setServerIssue(true);
    });
    return () => setServerIssueHandler(null);
  }, []);

  const openServerSettingsPrompt = useCallback(() => {
    Alert.alert('Проблема с сервером', 'Не удалось подключиться к серверу.', [
      { text: 'Отмена', style: 'cancel', onPress: () => setServerIssue(false) },
      {
        text: 'Настройки сервера',
        onPress: () => setServerReady(false),
      },
    ]);
  }, []);

  useEffect(() => {
    if (!serverIssue) return;
    openServerSettingsPrompt();
  }, [openServerSettingsPrompt, serverIssue]);

  if (loading || serverReady === null) return <LoadingScreen label="Подключение к серверу…" />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#f4f6f8' } }}>
        {!serverReady ? (
          <Stack.Screen
            name="ServerSetup"
            options={{ title: 'Настройки сервера' }}
          >
            {(props) => (
              <ServerSetupScreen
                {...props}
                onConfigured={() => {
                  setServerIssue(false);
                  setServerReady(true);
                }}
              />
            )}
          </Stack.Screen>
        ) : !user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Вход' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
            <Stack.Screen
              name="ServerSetup"
              options={{ title: 'Настройки сервера' }}
            >
              {(props) => (
                <ServerSetupScreen
                  {...props}
                  onConfigured={() => {
                    setServerIssue(false);
                    setServerReady(true);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : user.role === 'admin' ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Админ — РеестрПро' }} />
            <Stack.Screen name="Drivers" component={DriversScreen} options={{ title: 'Водители' }} />
            <Stack.Screen name="Contractors" component={ContractorsScreen} options={{ title: 'Контрагенты' }} />
            <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Все заказы' }} />
            <Stack.Screen name="OrderCreate" component={OrderCreateScreen} options={{ title: 'Новый заказ' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="Finances" component={FinancesScreen} options={{ title: 'Финансы' }} />
            <Stack.Screen name="AdminFinances" component={AdminFinancesScreen} options={{ title: 'Финансы' }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Документы' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Отчёты' }} />
            <Stack.Screen
              name="ServerSetup"
              options={{ title: 'Настройки сервера' }}
            >
              {(props) => (
                <ServerSetupScreen
                  {...props}
                  onConfigured={() => {
                    setServerIssue(false);
                    setServerReady(true);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: 'Водитель — РеестрПро' }} />
            <Stack.Screen name="DriverOrders" component={DriverOrdersScreen} options={{ title: 'Мои заказы' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="Finances" component={FinancesScreen} options={{ title: 'Мои финансы' }} />
            <Stack.Screen name="DriverFinances" component={DriverFinancesScreen} options={{ title: 'Мои финансы' }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Мои документы' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Мои отчёты' }} />
            <Stack.Screen
              name="ServerSetup"
              options={{ title: 'Настройки сервера' }}
            >
              {(props) => (
                <ServerSetupScreen
                  {...props}
                  onConfigured={() => {
                    setServerIssue(false);
                    setServerReady(true);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
