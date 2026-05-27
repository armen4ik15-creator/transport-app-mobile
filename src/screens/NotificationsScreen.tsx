import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createNotification, deleteNotification, listNotifications, markNotificationRead } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import type { NotificationItem } from '../types';

export function NotificationsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
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

  const pagedRows = useMemo(
    () => rows.slice(0, visibleCount),
    [rows, visibleCount]
  );
  const canLoadMore = rows.length > visibleCount;

  if (loading && rows.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={pagedRows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Уведомления</Title>
            <Subtitle>{isAdmin ? 'Рассылка и контроль уведомлений' : 'Ваши уведомления'}</Subtitle>
            <ErrorText message={error} />
            {isAdmin ? (
              <Card>
                <Title>Новое уведомление</Title>
                <Field label="ID пользователя" value={targetUserId} onChangeText={setTargetUserId} keyboardType="number-pad" />
                <Field label="Сообщение" value={message} onChangeText={setMessage} />
                <PrimaryButton label="Отправить" onPress={onCreate} loading={saving} />
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>{item.read ? 'Прочитано' : 'Новое'}</Title>
            <Subtitle>{item.message}</Subtitle>
            {item.user_email ? <Subtitle>Пользователь: {item.user_email}</Subtitle> : null}
            <Subtitle>{item.created_at}</Subtitle>
            {!item.read ? (
              <MenuButton label="Отметить прочитанным" onPress={() => onMarkRead(item.id)} variant="secondary" />
            ) : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        onEndReached={() => {
          if (canLoadMore) setVisibleCount((prev) => prev + 20);
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          canLoadMore ? (
            <MenuButton
              label="Показать ещё"
              onPress={() => setVisibleCount((prev) => prev + 20)}
              variant="secondary"
            />
          ) : null
        }
        ListEmptyComponent={<EmptyText text="Уведомлений пока нет" />}
      />
    </View>
  );
}
