import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MenuButton, Screen, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverHome'>;

export function DriverHomeScreen({ navigation }: Props) {
  const { user, driver, signOut } = useAuth();

  return (
    <Screen>
      <Title>Меню водителя</Title>
      <Subtitle>
        {driver?.full_name || user?.full_name || user?.email}
        {driver?.car_number ? ` · ${driver.car_number}` : ''}
      </Subtitle>
      <MenuButton label="📦 Мои заказы" onPress={() => navigation.navigate('DriverOrders')} />
      <MenuButton label="💰 Мои финансы" onPress={() => navigation.navigate('Finances')} />
      <MenuButton label="📑 Мои документы" onPress={() => navigation.navigate('Documents')} />
      <MenuButton label="📊 Мои отчёты" onPress={() => navigation.navigate('Reports')} />
      <MenuButton
        label="Выйти"
        onPress={() =>
          Alert.alert('Выход', 'Выйти из аккаунта?', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
          ])
        }
        variant="danger"
      />
    </Screen>
  );
}
