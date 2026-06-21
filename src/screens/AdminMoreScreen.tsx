import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HubListRow, PrimaryBanner, SectionTitle } from '../components/ui-kit';
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <PrimaryBanner
        icon="🏢"
        title={companyName}
        subtitle={`${user?.email ?? ''} · Администратор`}
      />

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.lg }}>
        <View>
          <SectionTitle>Операции</SectionTitle>
          <View style={hubCardStyle}>
            <HubListRow
              icon="👤"
              title="Водители"
              subtitle="Автопарк и контакты"
              tone="info"
              onPress={() => navigation.navigate('Drivers')}
            />
            <HubListRow
              icon="📑"
              title="Реестр рейсов"
              subtitle="ТТН и выгрузка Excel"
              tone="positive"
              onPress={() => navigation.navigate('RegistryReport')}
            />
            <HubListRow
              icon="💼"
              title="Финансы"
              subtitle="Отчёты и зарплаты"
              tone="warning"
              onPress={() => navigation.navigate('FinancesHub')}
            />
            <HubListRow
              icon="📋"
              title="Заявки на регистрацию"
              subtitle="Водители и учредители"
              tone="warning"
              badge={pendingRegistrationRequests}
              onPress={() => navigation.navigate('AdminRegistrationRequests')}
            />
            <HubListRow
              icon="🔔"
              title="Уведомления"
              subtitle="События и долги"
              tone="danger"
              badge={unreadNotifications}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>

        <View>
          <SectionTitle>Справочники</SectionTitle>
          <View style={hubCardStyle}>
            <HubListRow
              icon="🚛"
              title="Автомобили"
              subtitle="Техника и госномера"
              tone="neutral"
              onPress={() => navigation.navigate('Vehicles')}
            />
            <HubListRow
              icon="🧱"
              title="Материалы"
              subtitle="Песок, щебень, ПГС"
              tone="neutral"
              onPress={() => navigation.navigate('Materials')}
            />
            <HubListRow
              icon="📁"
              title="Документы и ТТН"
              subtitle="Шаблоны и сканы"
              tone="neutral"
              onPress={() => navigation.navigate('Documents')}
            />
          </View>
        </View>

        <View>
          <SectionTitle>Заказы и логистика</SectionTitle>
          <View style={hubCardStyle}>
            <HubListRow
              icon="🗂"
              title="Шаблоны заказов"
              subtitle="Быстрое создание заказов"
              tone="info"
              onPress={() => navigation.navigate('OrderTemplates')}
            />
            <HubListRow
              icon="🖼"
              title="Фото ТТН"
              subtitle="Все накладные по рейсам"
              tone="info"
              onPress={() => navigation.navigate('AllPhotos')}
            />
            <HubListRow
              icon="📊"
              title="Отчёты"
              subtitle="Сводка доходов и рейсов"
              tone="info"
              onPress={() => navigation.navigate('Reports')}
            />
          </View>
        </View>

        <View>
          <SectionTitle>Система</SectionTitle>
          <View style={hubCardStyle}>
            <HubListRow
              icon="🔄"
              title="Проверить обновление"
              subtitle={`Версия: ${updateLabel}`}
              tone="info"
              onPress={() => void checkAndApplyUpdate(true)}
            />
            <HubListRow
              icon="🌐"
              title="Настройки сервера"
              subtitle="Адрес API"
              tone="info"
              onPress={() =>
                navigation.navigate('ServerSetup', {
                  reason: 'Измените адрес сервера при необходимости',
                })
              }
            />
            <HubListRow
              icon="💾"
              title="Резервные копии"
              subtitle="БД, ТТН, документы — скачать архив"
              tone="positive"
              onPress={() => navigation.navigate('Backups')}
            />
            <HubListRow
              icon="📝"
              title="Журнал действий"
              subtitle="История изменений"
              tone="neutral"
              onPress={() => navigation.navigate('ActivityLog')}
            />
          </View>
        </View>

        <Pressable
          onPress={onLogout}
          style={{
            minHeight: 48,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.loss }}>Выйти из аккаунта</Text>
        </Pressable>

        <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted }}>
          ReestrPro · {updateLabel}
        </Text>
      </View>
    </ScrollView>
  );
}

const hubCardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.sm,
  paddingVertical: 4,
};
