import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components/ui';
import { NetworkIssueBanner } from '../components/NetworkIssueBanner';
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
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { OrderTemplatesScreen } from '../screens/OrderTemplatesScreen';
import { ServerSetupScreen } from '../screens/ServerSetupScreen';
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { TripCreateScreen } from '../screens/TripCreateScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { SalaryScreen } from '../screens/SalaryScreen';
import { ContractorDebtScreen } from '../screens/ContractorDebtScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { TripPhotosScreen } from '../screens/TripPhotosScreen';
import { MaterialsScreen } from '../screens/MaterialsScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { WaybillsScreen } from '../screens/WaybillsScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ActivityLogScreen } from '../screens/ActivityLogScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { OrderEditScreen } from '../screens/OrderEditScreen';
import { RegistryReportScreen } from '../screens/RegistryReportScreen';
import { FinanceReportScreen } from '../screens/FinanceReportScreen';
import { AdminMoreScreen } from '../screens/AdminMoreScreen';
import { AdminDriversHubScreen } from '../screens/AdminDriversHubScreen';
import { DriverDocumentsHubScreen } from '../screens/DriverDocumentsHubScreen';
import { DriverProfileScreen } from '../screens/DriverProfileScreen';
import { getServerUrl, setServerIssueHandler } from '../api/client';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminTabs: undefined;
  DriverTabs: undefined;
  AdminHome: undefined;
  AdminMore: undefined;
  AdminDriversHub: undefined;
  DriverDocumentsHub: undefined;
  Drivers: undefined;
  Contractors: undefined;
  Orders: undefined;
  OrderCreate: { templateId?: number } | undefined;
  OrderEdit: { id: number };
  Templates: undefined;
  OrderTemplates: undefined;
  OrderDetail: { id: number };
  MyOrders: undefined;
  DriverHome: undefined;
  DriverProfile: undefined;
  DriverOrders: undefined;
  Finances: undefined;
  AdminFinances: undefined;
  DriverFinances: undefined;
  Earnings: undefined;
  Salary: undefined;
  ContractorDebt: undefined;
  Expenses: undefined;
  TripPhotos: undefined;
  Materials: undefined;
  Vehicles: undefined;
  Waybills: undefined;
  Invoices: undefined;
  Notifications: undefined;
  ActivityLog: undefined;
  RegistryReport: undefined;
  FinanceReport: undefined;
  CompleteProfile: undefined;
  Documents: undefined;
  Reports: undefined;
  TripCreate: { orderId: number };
  ServerSetup: { reason?: string } | undefined;
};

type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminOrders: undefined;
  AdminDrivers: undefined;
  AdminFinancesTab: undefined;
  AdminMoreTab: undefined;
};

type DriverTabParamList = {
  DriverDashboard: undefined;
  DriverOrdersTab: undefined;
  DriverFinancesTab: undefined;
  DriverDocumentsTab: undefined;
  DriverProfileTab: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const DriverTab = createBottomTabNavigator<DriverTabParamList>();
const AdminDashboardStackNav = createNativeStackNavigator<RootStackParamList>();
const AdminOrdersStackNav = createNativeStackNavigator<RootStackParamList>();
const AdminDriversStackNav = createNativeStackNavigator<RootStackParamList>();
const AdminFinancesStackNav = createNativeStackNavigator<RootStackParamList>();
const AdminMoreStackNav = createNativeStackNavigator<RootStackParamList>();
const DriverDashboardStackNav = createNativeStackNavigator<RootStackParamList>();
const DriverOrdersStackNav = createNativeStackNavigator<RootStackParamList>();
const DriverFinancesStackNav = createNativeStackNavigator<RootStackParamList>();
const DriverDocumentsStackNav = createNativeStackNavigator<RootStackParamList>();
const DriverProfileStackNav = createNativeStackNavigator<RootStackParamList>();

const adminIconMap: Record<keyof AdminTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  AdminDashboard: 'view-dashboard-outline',
  AdminOrders: 'clipboard-text-outline',
  AdminDrivers: 'account-group-outline',
  AdminFinancesTab: 'cash-multiple',
  AdminMoreTab: 'dots-horizontal-circle-outline',
};

const driverIconMap: Record<keyof DriverTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  DriverDashboard: 'view-dashboard-outline',
  DriverOrdersTab: 'clipboard-check-outline',
  DriverFinancesTab: 'wallet-outline',
  DriverDocumentsTab: 'file-document-outline',
  DriverProfileTab: 'account-circle-outline',
};

export function RootNavigator() {
  const { user, driver, loading } = useAuth();
  const colorScheme = useColorScheme();
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [serverIssue, setServerIssue] = useState(false);
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);

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
      setShowNetworkBanner(true);
    });
    return () => setServerIssueHandler(null);
  }, []);

  const openServerSettingsPrompt = useCallback(() => {
    Alert.alert('Проблема с сервером', 'Не удалось подключиться к серверу.', [
      { text: 'Отмена', style: 'cancel', onPress: () => setServerIssue(false) },
      { text: 'Настройки сервера', onPress: () => setServerReady(false) },
    ]);
  }, []);

  useEffect(() => {
    if (!serverIssue) return;
    openServerSettingsPrompt();
  }, [openServerSettingsPrompt, serverIssue]);

  const onServerConfigured = useCallback(() => {
    setServerIssue(false);
    setShowNetworkBanner(false);
    setServerReady(true);
  }, []);

  const onRetryConnection = useCallback(() => {
    setServerIssue(false);
    setShowNetworkBanner(false);
    checkServerConfigured();
  }, [checkServerConfigured]);

  const renderServerSetup = useCallback(
    (props: NativeStackScreenProps<RootStackParamList, 'ServerSetup'>) => (
      <ServerSetupScreen {...props} onConfigured={onServerConfigured} />
    ),
    [onServerConfigured]
  );

  const navigationTheme = useMemo(
    () => (colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    [colorScheme]
  );

  if (loading || serverReady === null) {
    return <LoadingScreen label="Подключение к серверу…" />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <NetworkIssueBanner visible={showNetworkBanner} onRetry={onRetryConnection} />
      <RootStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#f4f6f8' } }}>
        {!serverReady ? (
          <RootStack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
            {renderServerSetup}
          </RootStack.Screen>
        ) : !user ? (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} options={{ title: 'Вход' }} />
            <RootStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
            <RootStack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {renderServerSetup}
            </RootStack.Screen>
          </>
        ) : user.role === 'admin' ? (
          <>
            <RootStack.Screen name="AdminTabs" component={AdminTabsNavigator} options={{ headerShown: false }} />
            <RootStack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {renderServerSetup}
            </RootStack.Screen>
          </>
        ) : !driver?.car_number || !driver?.full_name ? (
          <>
            <RootStack.Screen
              name="CompleteProfile"
              component={CompleteProfileScreen}
              options={{ title: 'Профиль водителя' }}
            />
            <RootStack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {renderServerSetup}
            </RootStack.Screen>
          </>
        ) : (
          <>
            <RootStack.Screen name="DriverTabs" component={DriverTabsNavigator} options={{ headerShown: false }} />
            <RootStack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {renderServerSetup}
            </RootStack.Screen>
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function AdminTabsNavigator() {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a5fb4',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={adminIconMap[route.name]} size={size} color={color} />
        ),
      })}
    >
      <AdminTab.Screen name="AdminDashboard" component={AdminDashboardStack} options={{ title: 'Главная' }} />
      <AdminTab.Screen name="AdminOrders" component={AdminOrdersStack} options={{ title: 'Заказы' }} />
      <AdminTab.Screen name="AdminDrivers" component={AdminDriversStack} options={{ title: 'Водители и авто' }} />
      <AdminTab.Screen name="AdminFinancesTab" component={AdminFinancesStack} options={{ title: 'Финансы' }} />
      <AdminTab.Screen name="AdminMoreTab" component={AdminMoreStack} options={{ title: 'Ещё' }} />
    </AdminTab.Navigator>
  );
}

function DriverTabsNavigator() {
  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a5fb4',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={driverIconMap[route.name]} size={size} color={color} />
        ),
      })}
    >
      <DriverTab.Screen name="DriverDashboard" component={DriverDashboardStack} options={{ title: 'Главная' }} />
      <DriverTab.Screen name="DriverOrdersTab" component={DriverOrdersStack} options={{ title: 'Мои заказы' }} />
      <DriverTab.Screen name="DriverFinancesTab" component={DriverFinancesStack} options={{ title: 'Мои финансы' }} />
      <DriverTab.Screen name="DriverDocumentsTab" component={DriverDocumentsStack} options={{ title: 'Документы' }} />
      <DriverTab.Screen name="DriverProfileTab" component={DriverProfileStack} options={{ title: 'Профиль' }} />
    </DriverTab.Navigator>
  );
}

function AdminDashboardStack() {
  return (
    <AdminDashboardStackNav.Navigator>
      <AdminDashboardStackNav.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Главная' }} />
      <AdminDashboardStackNav.Screen name="OrderCreate" component={OrderCreateScreen} options={{ title: 'Новый заказ' }} />
      <AdminDashboardStackNav.Screen name="Drivers" component={DriversScreen} options={{ title: 'Водители' }} />
      <AdminDashboardStackNav.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
      <AdminDashboardStackNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
    </AdminDashboardStackNav.Navigator>
  );
}

function AdminOrdersStack() {
  return (
    <AdminOrdersStackNav.Navigator>
      <AdminOrdersStackNav.Screen name="Orders" component={OrdersScreen} options={{ title: 'Заказы' }} />
      <AdminOrdersStackNav.Screen name="OrderCreate" component={OrderCreateScreen} options={{ title: 'Новый заказ' }} />
      <AdminOrdersStackNav.Screen name="OrderEdit" component={OrderEditScreen} options={{ title: 'Редактировать заказ' }} />
      <AdminOrdersStackNav.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
      <AdminOrdersStackNav.Screen name="OrderTemplates" component={OrderTemplatesScreen} options={{ title: 'Шаблоны заказов' }} />
      <AdminOrdersStackNav.Screen name="TripCreate" component={TripCreateScreen} options={{ title: 'Рейсы и ТТН' }} />
      <AdminOrdersStackNav.Screen name="TripPhotos" component={TripPhotosScreen} options={{ title: 'Фото ТТН' }} />
    </AdminOrdersStackNav.Navigator>
  );
}

function AdminDriversStack() {
  return (
    <AdminDriversStackNav.Navigator>
      <AdminDriversStackNav.Screen
        name="AdminDriversHub"
        component={AdminDriversHubScreen}
        options={{ title: 'Водители и авто' }}
      />
      <AdminDriversStackNav.Screen name="Drivers" component={DriversScreen} options={{ title: 'Водители' }} />
      <AdminDriversStackNav.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Автомобили' }} />
      <AdminDriversStackNav.Screen name="Materials" component={MaterialsScreen} options={{ title: 'Материалы' }} />
    </AdminDriversStackNav.Navigator>
  );
}

function AdminFinancesStack() {
  return (
    <AdminFinancesStackNav.Navigator>
      <AdminFinancesStackNav.Screen name="Finances" component={FinancesScreen} options={{ title: 'Финансы' }} />
      <AdminFinancesStackNav.Screen
        name="AdminFinances"
        component={AdminFinancesScreen}
        options={{ title: 'Финансовые операции' }}
      />
      <AdminFinancesStackNav.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Заработок' }} />
      <AdminFinancesStackNav.Screen name="Salary" component={SalaryScreen} options={{ title: 'Зарплаты водителей' }} />
      <AdminFinancesStackNav.Screen
        name="ContractorDebt"
        component={ContractorDebtScreen}
        options={{ title: 'Долги контрагентов' }}
      />
      <AdminFinancesStackNav.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Расходы' }} />
      <AdminFinancesStackNav.Screen name="Contractors" component={ContractorsScreen} options={{ title: 'Контрагенты' }} />
    </AdminFinancesStackNav.Navigator>
  );
}

function AdminMoreStack() {
  return (
    <AdminMoreStackNav.Navigator>
      <AdminMoreStackNav.Screen name="AdminMore" component={AdminMoreScreen} options={{ title: 'Ещё' }} />
      <AdminMoreStackNav.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Шаблоны документов' }} />
      <AdminMoreStackNav.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Документы' }} />
      <AdminMoreStackNav.Screen name="Reports" component={ReportsScreen} options={{ title: 'Отчёты' }} />
      <AdminMoreStackNav.Screen name="RegistryReport" component={RegistryReportScreen} options={{ title: 'Реестр рейсов' }} />
      <AdminMoreStackNav.Screen name="FinanceReport" component={FinanceReportScreen} options={{ title: 'Финансовый отчёт' }} />
      <AdminMoreStackNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
      <AdminMoreStackNav.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Журнал действий' }} />
      <AdminMoreStackNav.Screen name="Materials" component={MaterialsScreen} options={{ title: 'Материалы' }} />
      <AdminMoreStackNav.Screen name="Waybills" component={WaybillsScreen} options={{ title: 'Путевые листы' }} />
      <AdminMoreStackNav.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Счета' }} />
      <AdminMoreStackNav.Screen name="Contractors" component={ContractorsScreen} options={{ title: 'Контрагенты' }} />
    </AdminMoreStackNav.Navigator>
  );
}

function DriverDashboardStack() {
  return (
    <DriverDashboardStackNav.Navigator>
      <DriverDashboardStackNav.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: 'Главная' }} />
      <DriverDashboardStackNav.Screen name="DriverOrders" component={DriverOrdersScreen} options={{ title: 'Мои заказы' }} />
      <DriverDashboardStackNav.Screen name="Finances" component={FinancesScreen} options={{ title: 'Мои финансы' }} />
      <DriverDashboardStackNav.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Мой заработок' }} />
      <DriverDashboardStackNav.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Мои расходы' }} />
      <DriverDashboardStackNav.Screen name="Waybills" component={WaybillsScreen} options={{ title: 'Путевые листы' }} />
      <DriverDashboardStackNav.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Счета' }} />
      <DriverDashboardStackNav.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Документы' }} />
      <DriverDashboardStackNav.Screen name="Reports" component={ReportsScreen} options={{ title: 'Мои отчёты' }} />
      <DriverDashboardStackNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
      <DriverDashboardStackNav.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Мои действия' }} />
    </DriverDashboardStackNav.Navigator>
  );
}

function DriverOrdersStack() {
  return (
    <DriverOrdersStackNav.Navigator>
      <DriverOrdersStackNav.Screen name="DriverOrders" component={DriverOrdersScreen} options={{ title: 'Мои заказы' }} />
      <DriverOrdersStackNav.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
      <DriverOrdersStackNav.Screen name="TripCreate" component={TripCreateScreen} options={{ title: 'Рейсы и ТТН' }} />
      <DriverOrdersStackNav.Screen name="TripPhotos" component={TripPhotosScreen} options={{ title: 'Фото ТТН' }} />
    </DriverOrdersStackNav.Navigator>
  );
}

function DriverFinancesStack() {
  return (
    <DriverFinancesStackNav.Navigator>
      <DriverFinancesStackNav.Screen name="Finances" component={FinancesScreen} options={{ title: 'Мои финансы' }} />
      <DriverFinancesStackNav.Screen name="DriverFinances" component={DriverFinancesScreen} options={{ title: 'Операции' }} />
      <DriverFinancesStackNav.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Мой заработок' }} />
      <DriverFinancesStackNav.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Мои расходы' }} />
      <DriverFinancesStackNav.Screen name="Reports" component={ReportsScreen} options={{ title: 'Мои отчёты' }} />
    </DriverFinancesStackNav.Navigator>
  );
}

function DriverDocumentsStack() {
  return (
    <DriverDocumentsStackNav.Navigator>
      <DriverDocumentsStackNav.Screen
        name="DriverDocumentsHub"
        component={DriverDocumentsHubScreen}
        options={{ title: 'Документы' }}
      />
      <DriverDocumentsStackNav.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Мои документы' }} />
      <DriverDocumentsStackNav.Screen name="Waybills" component={WaybillsScreen} options={{ title: 'Путевые листы' }} />
      <DriverDocumentsStackNav.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Счета' }} />
    </DriverDocumentsStackNav.Navigator>
  );
}

function DriverProfileStack() {
  return (
    <DriverProfileStackNav.Navigator>
      <DriverProfileStackNav.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Профиль' }} />
      <DriverProfileStackNav.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ title: 'Редактировать профиль' }}
      />
      <DriverProfileStackNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
      <DriverProfileStackNav.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Мои действия' }} />
    </DriverProfileStackNav.Navigator>
  );
}
