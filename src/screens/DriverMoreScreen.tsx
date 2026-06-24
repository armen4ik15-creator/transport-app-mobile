import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

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
    <HubMenuScreen
      title="📂 Ещё"
      subtitle="Документы и настройки водителя"
      sections={[
        {
          title: '📑 Документы',
          items: [
            {
              icon: '🧾',
              title: 'Путевые листы',
              subtitle: 'Мои путевые листы',
              accentColor: colors.accent,
              onPress: () => navigation.navigate('Waybills'),
            },
            {
              icon: '🧮',
              title: 'Счета',
              subtitle: 'Счета по рейсам',
              accentColor: '#0d9488',
              onPress: () => navigation.navigate('Invoices'),
            },
            {
              icon: '📁',
              title: 'Документы',
              subtitle: 'Файлы и вложения',
              accentColor: '#6366f1',
              onPress: () => navigation.navigate('Documents'),
            },
            {
              icon: '📊',
              title: 'Отчёты',
              subtitle: 'Сводка по рейсам',
              accentColor: colors.primary,
              onPress: () => navigation.navigate('Reports'),
            },
            {
              icon: '📝',
              title: 'Мои действия',
              subtitle: 'Журнал активности',
              accentColor: '#475569',
              onPress: () => navigation.navigate('ActivityLog'),
            },
            {
              icon: '🔔',
              title: 'Уведомления',
              subtitle: 'Сообщения от диспетчера',
              accentColor: '#ea580c',
              onPress: () => navigation.navigate('Notifications'),
            },
          ],
        },
        {
          title: '⚙️ Настройки',
          items: [
            {
              icon: '🌐',
              title: 'Настройки сервера',
              subtitle: 'Адрес API',
              accentColor: colors.textMuted,
              onPress: () =>
                navigation.navigate('ServerSetup', {
                  reason: 'Измените адрес сервера при необходимости',
                }),
            },
            {
              icon: '🚪',
              title: 'Выйти',
              subtitle: 'Завершить сеанс',
              accentColor: colors.loss,
              onPress: onLogout,
              danger: true,
            },
          ],
        },
      ]}
    />
  );
}
