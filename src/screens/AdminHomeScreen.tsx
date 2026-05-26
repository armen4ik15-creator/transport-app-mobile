import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MenuButton, Screen, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;

export function AdminHomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen>
      <Title>Меню администратора</Title>
      <Subtitle>{user?.email}</Subtitle>
      <MenuButton label="👤 Водители" onPress={() => navigation.navigate('Drivers')} />
      <MenuButton label="🏢 Контрагенты" onPress={() => navigation.navigate('Contractors')} />
      <MenuButton label="📦 Все заказы" onPress={() => navigation.navigate('Orders')} />
      <MenuButton label="➕ Создать заказ" onPress={() => navigation.navigate('OrderCreate')} />
      <MenuButton label="💰 Финансы" onPress={() => navigation.navigate('Finances')} />
      <MenuButton label="📑 Документы" onPress={() => navigation.navigate('Documents')} />
      <MenuButton label="📊 Отчёты" onPress={() => navigation.navigate('Reports')} />
      <MenuButton label="Выйти" onPress={onLogout} variant="danger" />
    </Screen>
  );
}
