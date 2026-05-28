import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomBottomTabBar, type BottomTabItem } from '../components/CustomBottomTabBar';
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { DriverOrdersScreen } from '../screens/DriverOrdersScreen';
import { DriverFinancesHubScreen } from '../screens/DriverFinancesHubScreen';
import { DriverMoreScreen } from '../screens/DriverMoreScreen';
import type { DriverTabParamList, RootStackParamList } from './types';

const DRIVER_TABS: BottomTabItem<keyof DriverTabParamList>[] = [
  { id: 'DriverHome', label: 'Главная', emoji: '🏠' },
  { id: 'DriverOrders', label: 'Заказы', emoji: '📦' },
  { id: 'FinancesHub', label: 'Финансы', emoji: '💼' },
  { id: 'DriverMore', label: 'Ещё', emoji: '⚙️' },
];

const DRIVER_TAB_ROUTE = {
  DriverHome: 'DriverHome',
  DriverOrders: 'DriverOrders',
  FinancesHub: 'DriverFinancesHub',
  DriverMore: 'DriverMore',
} as const satisfies Record<keyof DriverTabParamList, keyof RootStackParamList>;

type DriverTabRouteName = (typeof DRIVER_TAB_ROUTE)[keyof DriverTabParamList];

interface DriverMainLayoutProps {
  activeTab: keyof DriverTabParamList;
  children: ReactNode;
}

function DriverMainLayout({ activeTab, children }: DriverMainLayoutProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6f8' }} edges={['top']}>
      <View style={{ flex: 1 }}>{children}</View>
      <CustomBottomTabBar
        items={DRIVER_TABS}
        activeId={activeTab}
        onSelect={(id) => {
          if (id === activeTab) return;
          navigation.replace(DRIVER_TAB_ROUTE[id] as DriverTabRouteName);
        }}
      />
    </SafeAreaView>
  );
}

function withDriverTab(activeTab: keyof DriverTabParamList, Screen: () => ReactNode) {
  return function DriverTabScreen() {
    return (
      <DriverMainLayout activeTab={activeTab}>
        <Screen />
      </DriverMainLayout>
    );
  };
}

export const DriverHomeTabScreen = withDriverTab('DriverHome', DriverHomeScreen);
export const DriverOrdersTabScreen = withDriverTab('DriverOrders', DriverOrdersScreen);
export const DriverFinancesHubTabScreen = withDriverTab('FinancesHub', DriverFinancesHubScreen);
export const DriverMoreTabScreen = withDriverTab('DriverMore', DriverMoreScreen);
