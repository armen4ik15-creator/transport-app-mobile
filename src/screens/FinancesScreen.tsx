import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, MenuButton, Screen, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Finances'>;

export function FinancesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return (
      <Screen>
        <Title>Финансы</Title>
        <Subtitle>Заработок, выплаты, расходы и долги</Subtitle>

        <Card>
          <Subtitle>Операции</Subtitle>
          <MenuButton label="💳 Финансовые операции" onPress={() => navigation.navigate('AdminFinances')} />
          <MenuButton label="📈 Заработок водителей" onPress={() => navigation.navigate('Earnings')} variant="secondary" />
          <MenuButton label="💵 Зарплаты" onPress={() => navigation.navigate('Salary')} variant="secondary" />
          <MenuButton label="⛽ Расходы" onPress={() => navigation.navigate('Expenses')} variant="secondary" />
        </Card>

        <Card>
          <Subtitle>Контрагенты и долги</Subtitle>
          <MenuButton label="🏢 Контрагенты" onPress={() => navigation.navigate('Contractors')} />
          <MenuButton
            label="📉 Долги контрагентов"
            onPress={() => navigation.navigate('ContractorDebt')}
            variant="secondary"
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Мои финансы</Title>
      <Subtitle>Заработок, расходы и баланс</Subtitle>

      <Card>
        <MenuButton label="💰 Мой баланс и операции" onPress={() => navigation.navigate('DriverFinances')} />
        <MenuButton label="📈 Мой заработок" onPress={() => navigation.navigate('Earnings')} variant="secondary" />
        <MenuButton label="⛽ Мои расходы" onPress={() => navigation.navigate('Expenses')} variant="secondary" />
        <MenuButton label="📊 Мои отчёты" onPress={() => navigation.navigate('Reports')} variant="secondary" />
      </Card>
    </Screen>
  );
}
