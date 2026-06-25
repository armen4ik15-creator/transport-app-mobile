import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListRow, ProfileCard, SectionLabel } from '../components/kit';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { listNotifications } from '../api/notifications';
import { countPendingAdminRegistrations } from '../api/adminRegistrations';
import { countPendingDriverRegistrations } from '../api/driverRegistrations';
import { colors, radii, spacing } from '../theme';
import { checkAndApplyUpdate, getCurrentUpdateLabel } from '../utils/appUpdate';
import { withFallback } from '../utils/safeRequest';

export function AdminMoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const updateLabel = getCurrentUpdateLabel();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRegistrationRequests, setPendingRegistrationRequests] = useState(0);

  const loadNotifications = useCallback(async () => {
    const items = await withFallback(() => listNotifications(), []);
    setUnreadNotifications(items.filter((item) => !item.read).length);
  }, []);

  const loadRegistrationRequests = useCallback(async () => {
    const [founders, drivers] = await Promise.all([
      withFallback(() => countPendingAdminRegistrations(), 0),
      withFallback(() => countPendingDriverRegistrations(), 0),
    ]);
    setPendingRegistrationRequests(founders + drivers);
  }, []);

  useEffect(() => {
    void loadNotifications();
    void loadRegistrationRequests();
  }, [loadNotifications, loadRegistrationRequests]);

  const onLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const companyName = user?.full_name?.trim() || 'ReestrPro';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}>
      <ProfileCard title={companyName} subtitle={`${user?.email ?? ''} · Администратор`} icon="home" />

      <SectionLabel>Операции</SectionLabel>
      <ListRow icon="users" title="Водители" subtitle="Автопарк и контакты" accent={colors.primary} onPress={() => navigation.navigate('Drivers')} />
      <ListRow icon="file-text" title="Реестр рейсов" subtitle="ТТН и выгрузка Excel" accent={colors.profit} onPress={() => navigation.navigate('RegistryReport')} />
      <ListRow icon="briefcase" title="Финансы" subtitle="Отчёты и зарплаты" accent={colors.warning} onPress={() => navigation.navigate('FinancesHub')} />
      <ListRow
        icon="clipboard"
        title="Заявки на регистрацию"
        subtitle="Водители и учредители"
        accent={colors.warning}
        trailing={pendingRegistrationRequests > 0 ? <Text style={{ color: colors.loss, fontWeight: '700' }}>{pendingRegistrationRequests}</Text> : undefined}
        onPress={() => navigation.navigate('AdminRegistrationRequests')}
      />
      <ListRow
        icon="bell"
        title="Уведомления"
        subtitle="События и долги"
        accent={colors.accent}
        trailing={unreadNotifications > 0 ? <Text style={{ color: colors.loss, fontWeight: '700' }}>{unreadNotifications}</Text> : undefined}
        onPress={() => navigation.navigate('Notifications')}
      />

      <SectionLabel>Справочники</SectionLabel>
      <ListRow icon="truck" title="Автомобили" subtitle="Техника и госномера" accent={colors.primary} onPress={() => navigation.navigate('Vehicles')} />
      <ListRow icon="box" title="Материалы" subtitle="Песок, щебень, ПГС" accent={colors.profit} onPress={() => navigation.navigate('Materials')} />
      <ListRow icon="folder" title="Документы и ТТН" subtitle="Шаблоны и сканы" accent={colors.warning} onPress={() => navigation.navigate('Documents')} />

      <SectionLabel>Заказы и логистика</SectionLabel>
      <ListRow icon="copy" title="Шаблоны заказов" subtitle="Быстрое создание" accent={colors.primaryLight} onPress={() => navigation.navigate('OrderTemplates')} />
      <ListRow icon="image" title="Фото ТТН" subtitle="Все накладные" accent={colors.primaryLight} onPress={() => navigation.navigate('AllPhotos')} />
      <ListRow icon="bar-chart-2" title="Отчёты" subtitle="Сводка доходов" accent={colors.primaryLight} onPress={() => navigation.navigate('Reports')} />

      <SectionLabel>Система</SectionLabel>
      <ListRow icon="globe" title="Настройки сервера" subtitle="Адрес API" accent={colors.textMuted} onPress={() => navigation.navigate('ServerSetup', {})} />
      <ListRow icon="download" title="Проверить обновление" subtitle={`Версия: ${updateLabel}`} accent={colors.primaryLight} onPress={() => void checkAndApplyUpdate(true)} />
      <ListRow icon="save" title="Резервные копии" subtitle="БД и документы" accent={colors.profit} onPress={() => navigation.navigate('Backups')} />
      <ListRow icon="activity" title="Журнал действий" subtitle="История изменений" accent={colors.textMuted} onPress={() => navigation.navigate('ActivityLog')} />

      <Pressable
        onPress={onLogout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: `${colors.loss}66`,
          backgroundColor: colors.lossMuted,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.loss }}>Выйти из аккаунта</Text>
      </Pressable>

      <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: spacing.md }}>
        ReestrPro · {updateLabel}
      </Text>
    </ScrollView>
  );
}
