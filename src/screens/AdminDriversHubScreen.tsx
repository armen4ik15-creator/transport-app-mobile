import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, MenuButton, Screen, Subtitle, Title } from '../components/ui';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDriversHub'>;

export function AdminDriversHubScreen({ navigation }: Props) {
  return (
    <Screen>
      <Title>Водители и авто</Title>
      <Subtitle>Управление персоналом, транспортом и справочниками</Subtitle>

      <Card>
        <Subtitle>Персонал и транспорт</Subtitle>
        <MenuButton label="👥 Список водителей" onPress={() => navigation.navigate('Drivers')} />
        <MenuButton label="🚚 Автомобили" onPress={() => navigation.navigate('Vehicles')} variant="secondary" />
      </Card>

      <Card>
        <Subtitle>Справочники</Subtitle>
        <MenuButton label="🧱 Материалы" onPress={() => navigation.navigate('Materials')} />
      </Card>
    </Screen>
  );
}
