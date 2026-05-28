import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, MenuButton, Subtitle, Title } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';

export function DriverFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
    >
      <Title>Мои финансы</Title>
      <Subtitle>Операции, заработок и расходы</Subtitle>

      <Card>
        <MenuButton label="💰 Операции" onPress={() => navigation.navigate('DriverFinances')} />
        <MenuButton label="🧮 Мой заработок" onPress={() => navigation.navigate('Earnings')} variant="secondary" />
        <MenuButton label="⛽ Мои расходы" onPress={() => navigation.navigate('Expenses')} variant="secondary" />
      </Card>
    </ScrollView>
  );
}
