import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubMenuScreen } from '../components/HubMenuScreen';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { checkAndApplyUpdate, getCurrentUpdateLabel } from '../utils/appUpdate';

export function AdminMoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();
  const updateLabel = getCurrentUpdateLabel();

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <HubMenuScreen
      title="🏢 Компания"
      subtitle="Справочники, документы, отчёты и настройки"
      sections={[
        {
          title: '📦 Заказы и логистика',
          items: [
            {
              icon: '🗂',
              title: 'Шаблоны заказов',
              subtitle: 'Готовые шаблоны для быстрого создания',
              accentColor: '#2563eb',
              onPress: () => navigation.navigate('OrderTemplates'),
            },
            {
              icon: '🖼',
              title: 'Фото ТТН',
              subtitle: 'Все накладные по рейсам',
              accentColor: '#0891b2',
              onPress: () => navigation.navigate('AllPhotos'),
            },
          ],
        },
        {
          title: '📚 Справочники',
          items: [
            {
              icon: '🚛',
              title: 'Автомобили',
              subtitle: 'Госномера и грузоподъёмность',
              accentColor: '#16a34a',
              onPress: () => navigation.navigate('Vehicles'),
            },
            {
              icon: '🧱',
              title: 'Материалы',
              subtitle: 'Виды грузов и материалов',
              accentColor: '#f59e0b',
              onPress: () => navigation.navigate('Materials'),
            },
          ],
        },
        {
          title: '📑 Документы и отчёты',
          items: [
            {
              icon: '📁',
              title: 'Документы',
              subtitle: 'Путевые, счета, акты',
              accentColor: '#6366f1',
              onPress: () => navigation.navigate('Documents'),
            },
            {
              icon: '🧾',
              title: 'Путевые листы',
              subtitle: 'Создание и просмотр',
              accentColor: '#7c3aed',
              onPress: () => navigation.navigate('Waybills'),
            },
            {
              icon: '🧮',
              title: 'Счета',
              subtitle: 'Выставление и учёт',
              accentColor: '#0d9488',
              onPress: () => navigation.navigate('Invoices'),
            },
            {
              icon: '📄',
              title: 'Шаблоны документов',
              subtitle: 'Word-шаблоны для печати',
              accentColor: '#64748b',
              onPress: () => navigation.navigate('Templates'),
            },
            {
              icon: '📊',
              title: 'Отчёты',
              subtitle: 'Сводка доходов и рейсов',
              accentColor: '#2563eb',
              onPress: () => navigation.navigate('Reports'),
            },
            {
              icon: '📝',
              title: 'Журнал действий',
              subtitle: 'История операций в системе',
              accentColor: '#475569',
              onPress: () => navigation.navigate('ActivityLog'),
            },
            {
              icon: '🔔',
              title: 'Уведомления',
              subtitle: 'Рассылка водителям',
              accentColor: '#ea580c',
              onPress: () => navigation.navigate('Notifications'),
            },
          ],
        },
        {
          title: '⚙️ Настройки',
          items: [
            {
              icon: '⛽',
              title: 'Топливные карты Opti',
              subtitle: 'Источник данных, синхронизация, привязка карт',
              accentColor: '#f97316',
              onPress: () => navigation.navigate('FuelSettings'),
            },
            {
              icon: '🔄',
              title: 'Проверить обновление',
              subtitle: `Текущая версия: ${updateLabel}`,
              accentColor: '#0891b2',
              onPress: () => void checkAndApplyUpdate(true),
            },
            {
              icon: '🌐',
              title: 'Настройки сервера',
              subtitle: 'Адрес API и порт HTTPS',
              accentColor: '#6b7280',
              onPress: () =>
                navigation.navigate('ServerSetup', {
                  reason: 'Измените адрес сервера при необходимости',
                }),
            },
            {
              icon: '🚪',
              title: 'Выйти',
              subtitle: 'Завершить сеанс администратора',
              accentColor: '#ef4444',
              onPress: onLogout,
              danger: true,
            },
          ],
        },
      ]}
    />
  );
}
