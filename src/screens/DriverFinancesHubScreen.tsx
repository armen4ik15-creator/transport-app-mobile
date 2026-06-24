import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

export function DriverFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HubMenuScreen
      title="💼 Мои финансы"
      subtitle="Операции, заработок и расходы"
      sections={[
        {
          title: 'Разделы',
          items: [
            {
              icon: '💰',
              title: 'Операции',
              subtitle: 'Доходы и выплаты',
              accentColor: '#6366f1',
              onPress: () => navigation.navigate('DriverFinances'),
            },
            {
              icon: '🧮',
              title: 'Мой заработок',
              subtitle: 'Ставка и начисления по рейсам',
              accentColor: colors.profit,
              onPress: () => navigation.navigate('Earnings'),
            },
            {
              icon: '💸',
              title: 'Мои расходы',
              subtitle: 'Топливо, ремонт, прочее',
              accentColor: colors.loss,
              onPress: () => navigation.navigate('Expenses'),
            },
          ],
        },
      ]}
    />
  );
}
