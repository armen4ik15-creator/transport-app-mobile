import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, MenuButton, Screen, Subtitle, Title } from '../components/ui';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminMore'>;

export function AdminMoreScreen({ navigation }: Props) {
  return (
    <Screen>
      <Title>Ещё</Title>
      <Subtitle>Документы, отчёты, справочники и системные разделы</Subtitle>

      <Card>
        <Subtitle>Документы</Subtitle>
        <MenuButton label="📑 Документы" onPress={() => navigation.navigate('Documents')} />
        <MenuButton label="🧾 Путевые листы" onPress={() => navigation.navigate('Waybills')} />
        <MenuButton label="🧮 Счета" onPress={() => navigation.navigate('Invoices')} />
        <MenuButton label="📄 Шаблоны документов" onPress={() => navigation.navigate('Templates')} />
      </Card>

      <Card>
        <Subtitle>Отчёты и аналитика</Subtitle>
        <MenuButton label="📊 Отчёты" onPress={() => navigation.navigate('Reports')} />
        <MenuButton label="📑 Реестр рейсов" onPress={() => navigation.navigate('RegistryReport')} />
        <MenuButton label="📈 Финансовый отчёт" onPress={() => navigation.navigate('FinanceReport')} />
        <MenuButton label="🖼 Фото ТТН" onPress={() => navigation.navigate('TripPhotos')} />
      </Card>

      <Card>
        <Subtitle>Операции и справочники</Subtitle>
        <MenuButton label="🧱 Материалы" onPress={() => navigation.navigate('Materials')} />
        <MenuButton label="🏢 Контрагенты" onPress={() => navigation.navigate('Contractors')} />
        <MenuButton label="🔔 Уведомления" onPress={() => navigation.navigate('Notifications')} />
        <MenuButton label="📝 Журнал действий" onPress={() => navigation.navigate('ActivityLog')} />
      </Card>

      <Card>
        <Subtitle>Система</Subtitle>
        <MenuButton
          label="⚙️ Настройки сервера"
          onPress={() => navigation.navigate('ServerSetup', { reason: 'Измените адрес сервера при необходимости' })}
          variant="secondary"
        />
      </Card>
    </Screen>
  );
}
