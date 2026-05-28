import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import type { RootStackParamList } from '../navigation/types';

export function AdminFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HubMenuScreen
      title="Финансы"
      subtitle="Отчёты, зарплата, операции"
      sections={[
        {
          title: 'Разделы',
          items: [
            { label: '💰 Финансовые операции', onPress: () => navigation.navigate('AdminFinances') },
            { label: '🧮 Заработок водителей', onPress: () => navigation.navigate('Earnings') },
            { label: '💵 Зарплаты', onPress: () => navigation.navigate('Salary') },
            { label: '🏦 Долги контрагентов', onPress: () => navigation.navigate('ContractorDebt') },
            { label: '📊 Финансовый отчёт', onPress: () => navigation.navigate('FinanceReport') },
          ],
        },
      ]}
    />
  );
}
