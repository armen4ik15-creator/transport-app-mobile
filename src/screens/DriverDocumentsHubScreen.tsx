import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, MenuButton, Screen, Subtitle, Title } from '../components/ui';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverDocumentsHub'>;

export function DriverDocumentsHubScreen({ navigation }: Props) {
  return (
    <Screen>
      <Title>Документы</Title>
      <Subtitle>Путевые листы, счета и загруженные файлы</Subtitle>

      <Card>
        <MenuButton label="📑 Все документы" onPress={() => navigation.navigate('Documents')} />
        <MenuButton label="🧾 Путевые листы" onPress={() => navigation.navigate('Waybills')} variant="secondary" />
        <MenuButton label="🧮 Счета" onPress={() => navigation.navigate('Invoices')} variant="secondary" />
      </Card>
    </Screen>
  );
}
