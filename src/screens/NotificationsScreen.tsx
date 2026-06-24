import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createNotification, deleteNotification, listNotifications, markNotificationRead } from '../api/notifications';
import {
  approveAdminRegistration,
  rejectAdminRegistration,
} from '../api/adminRegistrations';
import {
  approveDriverRegistration,
  rejectDriverRegistration,
} from '../api/driverRegistrations';
import { useAuth } from '../auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import type { NotificationItem } from '../types';
import { colors } from '../theme';

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [formVisible, setFormVisible] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingRefId, setActingRefId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await listNotifications());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить уведомления'));
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

  const onCreate = async () => {
    if (!isAdmin) return;
    const userId = Number(targetUserId);
    if (!Number.isFinite(userId) || userId <= 0 || !message.trim()) {
      Alert.alert('Ошибка', 'Укажите ID пользователя и текст уведомления');
      return;
    }
    setSaving(true);
    try {
      await createNotification({ user_id: userId, message: message.trim() });
      setTargetUserId('');
      setMessage('');
      setFormVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось отправить уведомление'));
    } finally {
      setSaving(false);
    }
  };

  const onMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось отметить как прочитанное'));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить уведомление'));
    }
  };

  const onApproveRegistration = async (refId: number, kind?: NotificationItem['kind']) => {
    setActingRefId(refId);
    try {
      const result =
        kind === 'driver_registration'
          ? await approveDriverRegistration(refId)
          : await approveAdminRegistration(refId);
      Alert.alert('Готово', result.message);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось одобрить заявку'));
    } finally {
      setActingRefId(null);
    }
  };

  const onRejectRegistration = async (refId: number, kind?: NotificationItem['kind']) => {
    setActingRefId(refId);
    try {
      const result =
        kind === 'driver_registration'
          ? await rejectDriverRegistration(refId)
          : await rejectAdminRegistration(refId);
      Alert.alert('Готово', result.message);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось отклонить заявку'));
    } finally {
      setActingRefId(null);
    }
  };

  useEffect(() => {
    setVisibleCount(20);
  }, [rows]);

  const pagedRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);
  const canLoadMore = rows.length > visibleCount;
  const unreadCount = rows.filter((r) => !r.read).length;

  if (loading && rows.length === 0) return <LoadingScreen label="Загрузка уведомлений…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={pagedRows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="🔔 Уведомления"
              actionLabel={isAdmin ? '+ Отправить' : undefined}
              onAction={isAdmin ? () => setFormVisible(true) : undefined}
            />
            <ScreenHero
              title="🔔 Центр уведомлений"
              subtitle={isAdmin ? 'Рассылка водителям и диспетчерам' : 'Сообщения от диспетчера'}
            />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Всего</Text>
                <Text style={[screenUi.sumValue, { color: colors.primary }]}>{rows.length}</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Непрочитано</Text>
                <Text style={[screenUi.sumValue, { color: colors.loss }]}>{unreadCount}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              screenUi.card,
              !item.read && { borderColor: colors.primary, backgroundColor: '#eff6ff' },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: item.read ? colors.textMuted : colors.primary }}>
                {item.read ? '✅ Прочитано' : '🔴 Новое'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{item.created_at}</Text>
            </View>
            <Text style={{ fontSize: 15, color: colors.text, marginTop: 6 }}>{item.message}</Text>
            {item.user_email ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>👤 {item.user_email}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              {isAdmin &&
              (item.kind === 'admin_registration' || item.kind === 'driver_registration') &&
              item.ref_id ? (
                <>
                  <Pressable
                    onPress={() => onApproveRegistration(item.ref_id!, item.kind)}
                    disabled={actingRefId === item.ref_id}
                  >
                    <Text style={{ color: colors.profit, fontSize: 13 }}>
                      {actingRefId === item.ref_id ? '…' : '✓ Одобрить'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onRejectRegistration(item.ref_id!, item.kind)}
                    disabled={actingRefId === item.ref_id}
                  >
                    <Text style={{ color: colors.loss, fontSize: 13 }}>
                      {actingRefId === item.ref_id ? '…' : '✕ Отклонить'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => navigation.navigate('AdminRegistrationRequests')}>
                    <Text style={{ color: colors.primary, fontSize: 13 }}>Все заявки</Text>
                  </Pressable>
                </>
              ) : null}
              {!item.read ? (
                <Pressable onPress={() => onMarkRead(item.id)}>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>✓ Прочитано</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => onDelete(item.id)}>
                <Text style={{ color: colors.loss, fontSize: 13 }}>🗑 Удалить</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        onEndReached={() => {
          if (canLoadMore) setVisibleCount((prev) => prev + 20);
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          canLoadMore ? (
            <MenuButton label="Показать ещё" onPress={() => setVisibleCount((prev) => prev + 20)} variant="secondary" />
          ) : null
        }
        ListEmptyComponent={<Text style={screenUi.emptyText}>Уведомлений пока нет</Text>}
      />

      {isAdmin ? (
        <FormBottomModal
          visible={formVisible}
          title="📨 Новое уведомление"
          saveLabel="Отправить"
          saving={saving}
          onSave={onCreate}
          onClose={() => {
            setFormVisible(false);
            setTargetUserId('');
            setMessage('');
          }}
        >
          <Field label="ID пользователя" value={targetUserId} onChangeText={setTargetUserId} keyboardType="number-pad" />
          <Field label="Сообщение" value={message} onChangeText={setMessage} />
        </FormBottomModal>
      ) : null}
    </View>
  );
}
