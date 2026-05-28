import { Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, MenuButton, Subtitle, Title } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';

export function DriverMoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f4f6f8' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
    >
      <Title>Ещё</Title>
      <Subtitle>Документы и настройки</Subtitle>

      <Card>
        <MenuButton label="🧾 Путевые листы" onPress={() => navigation.navigate('Waybills')} />
        <MenuButton label="🧮 Счета" onPress={() => navigation.navigate('Invoices')} variant="secondary" />
        <MenuButton label="📑 Документы" onPress={() => navigation.navigate('Documents')} variant="secondary" />
        <MenuButton label="📊 Отчёты" onPress={() => navigation.navigate('Reports')} variant="secondary" />
        <MenuButton label="📝 Мои действия" onPress={() => navigation.navigate('ActivityLog')} variant="secondary" />
        <MenuButton label="🔔 Уведомления" onPress={() => navigation.navigate('Notifications')} variant="secondary" />
      </Card>

      <Card>
        <MenuButton
          label="⚙️ Настройки сервера"
          onPress={() => navigation.navigate('ServerSetup', { reason: 'Измените адрес сервера при необходимости' })}
          variant="secondary"
        />
        <MenuButton label="Выйти" onPress={onLogout} variant="danger" />
      </Card>
    </ScrollView>
  );
}
