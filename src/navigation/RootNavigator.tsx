import { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { BootstrapErrorScreen } from '../components/BootstrapErrorScreen';
import { SplashScreen } from '../components/SplashScreen';
import { NetworkIssueBanner } from '../components/NetworkIssueBanner';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { OrderCreateScreen } from '../screens/OrderCreateScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { AdminFinancesScreen } from '../screens/AdminFinancesScreen';
import { DriverFinancesScreen } from '../screens/DriverFinancesScreen';
import { FinancesScreen } from '../screens/FinancesScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { OrderTemplatesScreen } from '../screens/OrderTemplatesScreen';
import { ServerSetupScreen } from '../screens/ServerSetupScreen';
import { TripCreateScreen } from '../screens/TripCreateScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { SalaryScreen } from '../screens/SalaryScreen';
import { ContractorDebtScreen } from '../screens/ContractorDebtScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { TripPhotosScreen } from '../screens/TripPhotosScreen';
import { AllPhotosScreen } from '../screens/AllPhotosScreen';
import { MaterialsScreen } from '../screens/MaterialsScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { VehicleDocumentsScreen } from '../screens/VehicleDocumentsScreen';
import { WaybillsScreen } from '../screens/WaybillsScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AdminRegistrationRequestsScreen } from '../screens/AdminRegistrationRequestsScreen';
import { ActivityLogScreen } from '../screens/ActivityLogScreen';
import { BackupsScreen } from '../screens/BackupsScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { OrderEditScreen } from '../screens/OrderEditScreen';
import { FinanceReportScreen } from '../screens/FinanceReportScreen';
import {
  AdminHomeTabScreen,
  AdminMoreTabScreen,
  ContractorsTabScreen,
  ExpensesTabScreen,
  OrdersTabScreen,
} from './AdminMainLayout';
import {
  DriversStackScreen,
  FinancesHubStackScreen,
  RegistryReportStackScreen,
} from './AdminStackScreens';
import {
  DriverFinancesHubTabScreen,
  DriverHomeTabScreen,
  DriverMoreTabScreen,
  DriverOrdersTabScreen,
} from './DriverMainLayout';
import { ensureDefaultServerUrl, getServerUrl, setServerIssueHandler, setServerIssueClearHandler } from '../api/client';
import { logStartup } from '../utils/startupLogger';
import type { RootStackParamList } from './types';

export type { AdminTabParamList, DriverTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const {
    user,
    driver,
    loading,
    initError,
    networkIssue,
    refresh,
    clearNetworkIssue,
    requestDataReload,
    retryInit,
  } = useAuth();
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);

  const checkServerConfigured = useCallback(async () => {
    try {
      void logStartup('server_config_check_start');
      await ensureDefaultServerUrl();
      setServerReady(true);
      void logStartup('server_config_check_done', 'production default applied');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка настройки сервера';
      void logStartup('server_config_check_error', message);
      setServerReady(true);
    }
  }, []);

  useEffect(() => {
    checkServerConfigured();
  }, [checkServerConfigured]);

  useEffect(() => {
    setServerIssueHandler(() => {
      setShowNetworkBanner(true);
    });
    setServerIssueClearHandler(() => {
      setShowNetworkBanner(false);
      clearNetworkIssue();
    });
    return () => {
      setServerIssueHandler(null);
      setServerIssueClearHandler(null);
    };
  }, [clearNetworkIssue]);

  useEffect(() => {
    if (networkIssue) setShowNetworkBanner(true);
  }, [networkIssue]);

  const onServerConfigured = useCallback(() => {
    setShowNetworkBanner(false);
    clearNetworkIssue();
    setServerReady(true);
    void refresh();
  }, [clearNetworkIssue, refresh]);

  const onRetryConnection = useCallback(() => {
    setShowNetworkBanner(false);
    clearNetworkIssue();
    requestDataReload();
    void refresh();
    checkServerConfigured();
  }, [checkServerConfigured, clearNetworkIssue, refresh, requestDataReload]);

  if (loading || serverReady === null) {
    return <SplashScreen />;
  }

  if (initError) {
    return (
      <BootstrapErrorScreen
        message={initError}
        onRetry={() => void retryInit()}
        retrying={loading}
      />
    );
  }

  return (
    <NavigationContainer>
      <NetworkIssueBanner visible={showNetworkBanner} onRetry={onRetryConnection} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        {!serverReady ? (
          <Stack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
            {(props) => <ServerSetupScreen {...props} onConfigured={onServerConfigured} />}
          </Stack.Screen>
        ) : !user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Вход' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Восстановление пароля' }} />
            <Stack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {(props) => <ServerSetupScreen {...props} onConfigured={onServerConfigured} />}
            </Stack.Screen>
          </>
        ) : user.role === 'admin' ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Contractors" component={ContractorsTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Drivers" component={DriversStackScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Expenses" component={ExpensesTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Orders" component={OrdersTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RegistryReport" component={RegistryReportStackScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FinancesHub" component={FinancesHubStackScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminMore" component={AdminMoreTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderCreate" component={OrderCreateScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderEdit" component={OrderEditScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Шаблоны документов' }} />
            <Stack.Screen name="OrderTemplates" component={OrderTemplatesScreen} options={{ title: 'Шаблоны заказов' }} />
            <Stack.Screen name="Materials" component={MaterialsScreen} options={{ title: 'Материалы' }} />
            <Stack.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Автомобили' }} />
            <Stack.Screen name="VehicleDocuments" component={VehicleDocumentsScreen} options={{ title: 'Документы на авто' }} />
            <Stack.Screen name="Waybills" component={WaybillsScreen} options={{ title: 'Путевые листы' }} />
            <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Счета' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
            <Stack.Screen
              name="AdminRegistrationRequests"
              component={AdminRegistrationRequestsScreen}
              options={{ title: 'Заявки учредителей' }}
            />
            <Stack.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Журнал действий' }} />
            <Stack.Screen name="Backups" component={BackupsScreen} options={{ title: 'Резервные копии' }} />
            <Stack.Screen name="FinanceReport" component={FinanceReportScreen} options={{ title: 'Финансовый отчёт' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="Finances" component={FinancesScreen} options={{ title: 'Финансы' }} />
            <Stack.Screen name="AdminFinances" component={AdminFinancesScreen} options={{ title: 'Финансовые операции' }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Документы' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Отчёты' }} />
            <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Заработок' }} />
            <Stack.Screen name="Salary" component={SalaryScreen} options={{ title: 'Зарплаты водителей' }} />
            <Stack.Screen
              name="ContractorDebt"
              component={ContractorDebtScreen}
              options={{ title: 'Оплаты контрагентов' }}
            />
            <Stack.Screen name="TripPhotos" component={TripPhotosScreen} options={{ title: 'Фото ТТН' }} />
            <Stack.Screen name="AllPhotos" component={AllPhotosScreen} options={{ title: 'Фотографии ТТН' }} />
            <Stack.Screen name="TripCreate" component={TripCreateScreen} options={{ title: 'Рейсы и ТТН' }} />
            <Stack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {(props) => <ServerSetupScreen {...props} onConfigured={onServerConfigured} />}
            </Stack.Screen>
          </>
        ) : !driver?.car_number || !driver?.full_name ? (
          <>
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: 'Профиль водителя' }} />
            <Stack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {(props) => <ServerSetupScreen {...props} onConfigured={onServerConfigured} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="DriverHome" component={DriverHomeTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DriverOrders" component={DriverOrdersTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DriverFinancesHub" component={DriverFinancesHubTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DriverMore" component={DriverMoreTabScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="Waybills" component={WaybillsScreen} options={{ title: 'Путевые листы' }} />
            <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Счета' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
            <Stack.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Мои действия' }} />
            <Stack.Screen name="Finances" component={FinancesScreen} options={{ title: 'Мои финансы' }} />
            <Stack.Screen name="DriverFinances" component={DriverFinancesScreen} options={{ title: 'Операции' }} />
            <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Документы' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Отчёты' }} />
            <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Мой заработок' }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Мои расходы' }} />
            <Stack.Screen name="TripCreate" component={TripCreateScreen} options={{ title: 'Рейсы и ТТН' }} />
            <Stack.Screen name="ServerSetup" options={{ title: 'Настройки сервера' }}>
              {(props) => <ServerSetupScreen {...props} onConfigured={onServerConfigured} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
