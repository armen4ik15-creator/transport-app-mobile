import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubCardMenu } from '../components/HubCardMenu';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

export function AdminFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HubCardMenu
      title="💼 Все финансы"
      subtitle="Выберите раздел"
      items={[
        {
          icon: '📊',
          title: 'Финансовый отчёт',
          subtitle: 'День / неделя / месяц / квартал / год · Excel 3 листа',
          accentColor: colors.primary,
          onPress: () => navigation.navigate('FinanceReport'),
        },
        {
          icon: '💵',
          title: 'Зарплата',
          subtitle: 'Начисления, выплаты водителям',
          accentColor: colors.profit,
          onPress: () => navigation.navigate('Salary'),
        },
        {
          icon: '🧮',
          title: 'Заработок водителей',
          subtitle: 'Ставка за рейс · начисления',
          accentColor: colors.primary,
          onPress: () => navigation.navigate('Earnings'),
        },
        {
          icon: '💸',
          title: 'Расходы',
          subtitle: 'Топливо, ремонт, штрафы · Excel',
          accentColor: colors.loss,
          onPress: () => navigation.replace('Expenses'),
        },
        {
          icon: '🖼',
          title: 'Фото ТТН',
          subtitle: 'Все накладные · просмотр и сохранение',
          accentColor: colors.warning,
          onPress: () => navigation.navigate('AllPhotos'),
        },
        {
          icon: '💰',
          title: 'Финансовые операции',
          subtitle: 'Ручные доходы и расходы',
          accentColor: '#6366f1',
          onPress: () => navigation.navigate('AdminFinances'),
        },
        {
          icon: '🏦',
          title: 'Оплаты контрагентов',
          subtitle: 'Навезли · оплатили · остаток долга · история оплат',
          accentColor: '#64748b',
          onPress: () => navigation.navigate('ContractorDebt'),
        },
      ]}
    />
  );
}
