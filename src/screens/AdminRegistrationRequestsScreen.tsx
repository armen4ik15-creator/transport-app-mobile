import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import {
  approveAdminRegistration,
  listAdminRegistrationRequests,
  rejectAdminRegistration,
} from '../api/adminRegistrations';
import {
  approveDriverRegistration,
  listDriverRegistrationRequests,
  rejectDriverRegistration,
} from '../api/driverRegistrations';
import { screenUi } from '../styles/screenUi';
import type { AdminRegistrationRequest, DriverRegistrationRequest } from '../types';

type Tab = 'founder' | 'driver';

const STATUS_LABELS: Record<AdminRegistrationRequest['status'], string> = {
  pending: '⏳ Ожидает',
  approved: '✅ Одобрена',
  rejected: '❌ Отклонена',
};

export function AdminRegistrationRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<Tab>('driver');
  const [founderRows, setFounderRows] = useState<AdminRegistrationRequest[]>([]);
  const [driverRows, setDriverRows] = useState<DriverRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const errors: string[] = [];

    try {
      setFounderRows(await listAdminRegistrationRequests());
    } catch (e) {
      errors.push(apiErrorMessage(e, 'Не удалось загрузить заявки учредителей'));
      setFounderRows([]);
    }

    try {
      setDriverRows(await listDriverRegistrationRequests());
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить заявки водителей');
      errors.push(msg);
      setDriverRows([]);
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rows = tab === 'founder' ? founderRows : driverRows;
  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === 'pending').length,
    [rows]
  );

  const handleApprove = async (id: number) => {
    setActingId(id);
    try {
      const result =
        tab === 'founder'
          ? await approveAdminRegistration(id)
          : await approveDriverRegistration(id);
      Alert.alert('Готово', result.message);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось одобрить заявку'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number, reason?: string) => {
    setActingId(id);
    try {
      const result =
        tab === 'founder'
          ? await rejectAdminRegistration(id, reason)
          : await rejectDriverRegistration(id, reason);
      Alert.alert('Готово', result.message);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось отклонить заявку'));
    } finally {
      setActingId(null);
    }
  };

  const onApprove = (row: AdminRegistrationRequest | DriverRegistrationRequest) => {
    const label = tab === 'founder' ? 'администратора' : 'водителя';
    Alert.alert('Одобрить заявку', `Создать ${label} ${row.full_name}?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Одобрить', onPress: () => void handleApprove(row.id) },
    ]);
  };

  const onReject = (row: AdminRegistrationRequest | DriverRegistrationRequest) => {
    Alert.prompt
      ? Alert.prompt('Отклонить заявку', 'Причина (необязательно)', [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отклонить',
            style: 'destructive',
            onPress: (reason?: string) => void handleReject(row.id, reason || undefined),
          },
        ])
      : Alert.alert('Отклонить заявку', `Отклонить ${row.full_name}?`, [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отклонить',
            style: 'destructive',
            onPress: () => void handleReject(row.id),
          },
        ]);
  };

  if (loading && founderRows.length === 0 && driverRows.length === 0) {
    return <LoadingScreen label="Загрузка заявок…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => `${tab}-${item.id}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📋 Заявки на регистрацию" />
            <ScreenHero
              title={tab === 'founder' ? 'Учредители' : 'Водители'}
              subtitle={
                tab === 'founder'
                  ? 'Одобряет только главный администратор'
                  : 'Любой администратор может одобрить водителя'
              }
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TabChip label="Водители" active={tab === 'driver'} onPress={() => setTab('driver')} />
              <TabChip label="Учредители" active={tab === 'founder'} onPress={() => setTab('founder')} />
            </View>
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Ожидают</Text>
                <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{pendingCount}</Text>
              </View>
            </View>
            <ErrorText message={error} />
            {error?.includes('404') ? (
              <MenuButton
                label="⚙️ Проверить адрес сервера"
                onPress={() =>
                  navigation.navigate('ServerSetup', {
                    reason: 'Укажите продакшен-сервер armen4ik15-creator-transport-app-server-43b9.twc1.net порт 443',
                  })
                }
                variant="secondary"
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const driverItem = tab === 'driver' ? (item as DriverRegistrationRequest) : null;
          return (
            <View style={[screenUi.card, item.status === 'pending' && { borderColor: '#f59e0b' }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{item.full_name}</Text>
              <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>{item.email}</Text>
              {item.phone ? (
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>📞 {item.phone}</Text>
              ) : null}
              {driverItem?.license_number ? (
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  ВУ: {driverItem.license_number}
                </Text>
              ) : null}
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                {STATUS_LABELS[item.status]} · {item.created_at}
              </Text>
              {item.reviewed_by_name ? (
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Решение: {item.reviewed_by_name}
                  {item.rejection_reason ? ` — ${item.rejection_reason}` : ''}
                </Text>
              ) : null}
              {item.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <Pressable onPress={() => onApprove(item)} disabled={actingId === item.id} style={{ paddingVertical: 6 }}>
                    <Text style={{ color: '#16a34a', fontWeight: '600' }}>
                      {actingId === item.id ? '…' : '✓ Одобрить'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => onReject(item)} disabled={actingId === item.id} style={{ paddingVertical: 6 }}>
                    <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                      {actingId === item.id ? '…' : '✕ Отклонить'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Заявок пока нет</Text>}
        ListFooterComponent={
          rows.length > 0 ? (
            <MenuButton label="Обновить" onPress={() => void onRefresh()} variant="secondary" />
          ) : null
        }
      />
    </View>
  );
}

function TabChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? '#2563eb' : '#d1d5db',
        backgroundColor: active ? '#eff6ff' : '#fff',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontWeight: '600', color: active ? '#2563eb' : '#6b7280' }}>{label}</Text>
    </Pressable>
  );
}
