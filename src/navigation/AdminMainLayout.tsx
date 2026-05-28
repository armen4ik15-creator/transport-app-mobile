import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomBottomTabBar, type BottomTabItem } from '../components/CustomBottomTabBar';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { ContractorsScreen } from '../screens/ContractorsScreen';
import { DriversScreen } from '../screens/DriversScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { RegistryReportScreen } from '../screens/RegistryReportScreen';
import { AdminFinancesHubScreen } from '../screens/AdminFinancesHubScreen';
import { AdminMoreScreen } from '../screens/AdminMoreScreen';
import type { AdminTabParamList, RootStackParamList } from './types';

const ADMIN_TABS: BottomTabItem<keyof AdminTabParamList>[] = [
  { id: 'AdminHome', label: 'Главная', emoji: '🏠' },
  { id: 'Contractors', label: 'Контрагенты', emoji: '💰' },
  { id: 'Drivers', label: 'Водители', emoji: '👤' },
  { id: 'Expenses', label: 'Расходы', emoji: '💸' },
  { id: 'Orders', label: 'Заказы', emoji: '📦' },
  { id: 'RegistryReport', label: 'Реестр', emoji: '📑' },
  { id: 'FinancesHub', label: 'Финансы', emoji: '💼' },
  { id: 'AdminMore', label: 'Ещё', emoji: '⚙️' },
];

const ADMIN_TAB_ROUTE = {
  AdminHome: 'AdminHome',
  Contractors: 'Contractors',
  Drivers: 'Drivers',
  Expenses: 'Expenses',
  Orders: 'Orders',
  RegistryReport: 'RegistryReport',
  FinancesHub: 'FinancesHub',
  AdminMore: 'AdminMore',
} as const satisfies Record<keyof AdminTabParamList, keyof RootStackParamList>;

type AdminTabRouteName = (typeof ADMIN_TAB_ROUTE)[keyof AdminTabParamList];

interface AdminMainLayoutProps {
  activeTab: keyof AdminTabParamList;
  children: ReactNode;
}

function AdminMainLayout({ activeTab, children }: AdminMainLayoutProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6f8' }} edges={['top']}>
      <View style={{ flex: 1 }}>{children}</View>
      <CustomBottomTabBar
        items={ADMIN_TABS}
        activeId={activeTab}
        onSelect={(id) => {
          if (id === activeTab) return;
          navigation.replace(ADMIN_TAB_ROUTE[id] as AdminTabRouteName);
        }}
      />
    </SafeAreaView>
  );
}

function withAdminTab(activeTab: keyof AdminTabParamList, Screen: () => ReactNode) {
  return function AdminTabScreen() {
    return (
      <AdminMainLayout activeTab={activeTab}>
        <Screen />
      </AdminMainLayout>
    );
  };
}

export const AdminHomeTabScreen = withAdminTab('AdminHome', AdminHomeScreen);
export const ContractorsTabScreen = withAdminTab('Contractors', ContractorsScreen);
export const DriversTabScreen = withAdminTab('Drivers', DriversScreen);
export const ExpensesTabScreen = withAdminTab('Expenses', ExpensesScreen);
export const OrdersTabScreen = withAdminTab('Orders', OrdersScreen);
export const RegistryReportTabScreen = withAdminTab('RegistryReport', RegistryReportScreen);
export const AdminFinancesHubTabScreen = withAdminTab('FinancesHub', AdminFinancesHubScreen);
export const AdminMoreTabScreen = withAdminTab('AdminMore', AdminMoreScreen);
