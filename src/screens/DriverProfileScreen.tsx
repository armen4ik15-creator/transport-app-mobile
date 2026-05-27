import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, MenuButton, Screen, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverProfile'>;

export function DriverProfileScreen({ navigation }: Props) {
  const { user, driver, signOut } = useAuth();

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen>
      <Title>Профиль</Title>
      <Subtitle>Данные водителя и настройки</Subtitle>

      <Card>
        <Title>{driver?.full_name || user?.full_name || user?.email}</Title>
        <Subtitle>Email: {user?.email}</Subtitle>
        <Subtitle>Телефон: {driver?.phone || user?.phone || '—'}</Subtitle>
        <Subtitle>Госномер: {driver?.car_number || '—'}</Subtitle>
      </Card>

      <Card>
        <Subtitle>Личный кабинет</Subtitle>
        <MenuButton label="👤 Редактировать профиль" onPress={() => navigation.navigate('CompleteProfile')} />
        <MenuButton label="🔔 Уведомления" onPress={() => navigation.navigate('Notifications')} />
        <MenuButton label="📝 Мои действия" onPress={() => navigation.navigate('ActivityLog')} />
      </Card>

      <Card>
        <Subtitle>Система</Subtitle>
        <MenuButton
          label="⚙️ Настройки сервера"
          onPress={() => navigation.navigate('ServerSetup', { reason: 'Измените адрес сервера при необходимости' })}
          variant="secondary"
        />
        <MenuButton label="Выйти" onPress={onLogout} variant="danger" />
      </Card>
    </Screen>
  );
}
