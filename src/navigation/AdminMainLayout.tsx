import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomBottomTabBar, type BottomTabItem } from '../components/CustomBottomTabBar';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { ContractorsScreen } from '../screens/ContractorsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { AdminMoreScreen } from '../screens/AdminMoreScreen';
import type { AdminTabParamList, RootStackParamList } from './types';
import { colors } from '../theme';

/** v0 navigation: 5 primary tabs; Drivers/Registry/Finances — stack from «Ещё». */
const ADMIN_TABS: BottomTabItem<keyof AdminTabParamList>[] = [
  { id: 'AdminHome', label: 'Главная', emoji: '🏠' },
  { id: 'Orders', label: 'Заказы', emoji: '📦' },
  { id: 'Expenses', label: 'Расходы', emoji: '💸' },
  { id: 'Contractors', label: 'Контраг.', emoji: '🏢' },
  { id: 'AdminMore', label: 'Ещё', emoji: '⋯' },
];

const ADMIN_TAB_ROUTE = {
  AdminHome: 'AdminHome',
  Orders: 'Orders',
  Expenses: 'Expenses',
  Contractors: 'Contractors',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1 }}>{children}</View>
      <CustomBottomTabBar
        items={ADMIN_TABS}
        activeId={activeTab}
        onSelect={(id) => {
          if (id === activeTab) return;
          navigation.navigate(ADMIN_TAB_ROUTE[id] as AdminTabRouteName);
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
export const ExpensesTabScreen = withAdminTab('Expenses', ExpensesScreen);
export const OrdersTabScreen = withAdminTab('Orders', OrdersScreen);
export const AdminMoreTabScreen = withAdminTab('AdminMore', AdminMoreScreen);
