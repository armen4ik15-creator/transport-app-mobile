import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubCardMenu } from '../components/HubCardMenu';
import type { RootStackParamList } from '../navigation/types';

export function AdminFinancesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HubCardMenu
      title="Все финансы"
      subtitle="Выберите раздел"
      items={[
        {
          icon: '📊',
          title: 'Финансовый отчёт',
          subtitle: 'День / неделя / месяц / квартал / год · Excel 3 листа',
          accentColor: '#2563eb',
          onPress: () => navigation.navigate('FinanceReport'),
        },
        {
          icon: '💵',
          title: 'Зарплата',
          subtitle: 'Начисления, выплаты водителям',
          accentColor: '#16a34a',
          onPress: () => navigation.navigate('Salary'),
        },
        {
          icon: '🧮',
          title: 'Заработок водителей',
          subtitle: 'Ставка за рейс · начисления',
          accentColor: '#0891b2',
          onPress: () => navigation.navigate('Earnings'),
        },
        {
          icon: '💸',
          title: 'Расходы',
          subtitle: 'Топливо, ремонт, штрафы · Excel',
          accentColor: '#ef4444',
          onPress: () => navigation.replace('Expenses'),
        },
        {
          icon: '🖼',
          title: 'Фото ТТН',
          subtitle: 'Все накладные · просмотр и сохранение',
          accentColor: '#f59e0b',
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
