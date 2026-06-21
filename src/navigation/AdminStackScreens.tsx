import { SafeAreaView } from 'react-native-safe-area-context';
import { DriversScreen } from '../screens/DriversScreen';
import { RegistryReportScreen } from '../screens/RegistryReportScreen';
import { AdminFinancesHubScreen } from '../screens/AdminFinancesHubScreen';
import { colors } from '../theme';

/** Stack-only screens from v0 «Ещё» hub — без нижней панели вкладок. */
export function DriversStackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <DriversScreen />
    </SafeAreaView>
  );
}

export function RegistryReportStackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <RegistryReportScreen />
    </SafeAreaView>
  );
}

export function FinancesHubStackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AdminFinancesHubScreen />
    </SafeAreaView>
  );
}
