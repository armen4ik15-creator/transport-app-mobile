import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';

export function AdminMoreScreen() {
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
      title="Компания"
      subtitle="Справочники, документы и настройки"
      sections={[
        {
          title: 'Заказы и логистика',
          items: [
            { label: '🗂 Шаблоны заказов', onPress: () => navigation.navigate('OrderTemplates') },
            { label: '🖼 Фото ТТН', onPress: () => navigation.navigate('TripPhotos') },
          ],
        },
        {
          title: 'Справочники',
          items: [
            { label: '🚛 Автомобили', onPress: () => navigation.navigate('Vehicles') },
            { label: '🧱 Материалы', onPress: () => navigation.navigate('Materials') },
          ],
        },
        {
          title: 'Документы и отчёты',
          items: [
            { label: '📑 Документы', onPress: () => navigation.navigate('Documents') },
            { label: '🧾 Путевые листы', onPress: () => navigation.navigate('Waybills') },
            { label: '🧮 Счета', onPress: () => navigation.navigate('Invoices') },
            { label: '📄 Шаблоны документов', onPress: () => navigation.navigate('Templates') },
            { label: '📊 Отчёты', onPress: () => navigation.navigate('Reports') },
            { label: '📝 Журнал действий', onPress: () => navigation.navigate('ActivityLog') },
            { label: '🔔 Уведомления', onPress: () => navigation.navigate('Notifications') },
          ],
        },
        {
          title: 'Настройки',
          items: [
            {
              label: '⚙️ Настройки сервера',
              onPress: () =>
                navigation.navigate('ServerSetup', {
                  reason: 'Измените адрес сервера при необходимости',
                }),
            },
            { label: 'Выйти', onPress: onLogout, variant: 'danger' },
          ],
        },
      ]}
    />
  );
}
