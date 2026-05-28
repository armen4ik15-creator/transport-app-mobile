import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, MenuButton, Subtitle, Title } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';

export function AdminFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
    >
      <Title>Все финансы</Title>
      <Subtitle>Отчёты, зарплата, операции</Subtitle>

      <Card>
        <MenuButton label="💰 Финансовые операции" onPress={() => navigation.navigate('AdminFinances')} />
        <MenuButton label="🧮 Заработок водителей" onPress={() => navigation.navigate('Earnings')} variant="secondary" />
        <MenuButton label="💵 Зарплаты" onPress={() => navigation.navigate('Salary')} variant="secondary" />
        <MenuButton label="🏦 Долги контрагентов" onPress={() => navigation.navigate('ContractorDebt')} variant="secondary" />
        <MenuButton label="📊 Финансовый отчёт" onPress={() => navigation.navigate('FinanceReport')} variant="secondary" />
      </Card>
    </ScrollView>
  );
}
