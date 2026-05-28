import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import type { RootStackParamList } from '../navigation/types';

export function DriverFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HubMenuScreen
      title="Финансы"
      subtitle="Операции, заработок и расходы"
      sections={[
        {
          title: 'Разделы',
          items: [
            { label: '💰 Операции', onPress: () => navigation.navigate('DriverFinances') },
            { label: '🧮 Мой заработок', onPress: () => navigation.navigate('Earnings') },
            { label: '⛽ Мои расходы', onPress: () => navigation.navigate('Expenses') },
          ],
        },
      ]}
    />
  );
}
