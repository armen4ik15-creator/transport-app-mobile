import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createNotification, deleteNotification, listNotifications, markNotificationRead } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import { screenUi } from '../styles/screenUi';
import type { NotificationItem } from '../types';

export function NotificationsScreen() {
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
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Всего</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{rows.length}</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Непрочитано</Text>
                <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{unreadCount}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              screenUi.card,
              !item.read && { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: item.read ? '#6b7280' : '#2563eb' }}>
                {item.read ? '✅ Прочитано' : '🔴 Новое'}
              </Text>
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>{item.created_at}</Text>
            </View>
            <Text style={{ fontSize: 15, color: '#111827', marginTop: 6 }}>{item.message}</Text>
            {item.user_email ? (
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>👤 {item.user_email}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              {!item.read ? (
                <Pressable onPress={() => onMarkRead(item.id)}>
                  <Text style={{ color: '#2563eb', fontSize: 13 }}>✓ Прочитано</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => onDelete(item.id)}>
                <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
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
