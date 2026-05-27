import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, LoadingScreen, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listActivity } from '../api/activity';
import type { ActivityLogItem } from '../types';

function formatDetails(details: string | null): string {
  if (!details) return '';
  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');
  } catch {
    return details;
  }
}

export function ActivityLogScreen() {
  const [rows, setRows] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await listActivity());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить журнал действий'));
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

  const formatted = useMemo(
    () =>
      rows.map((item) => ({
        ...item,
        detailsText: formatDetails(item.details),
      })),
    [rows]
  );

  if (loading && rows.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={formatted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Журнал действий</Title>
            <Subtitle>История операций пользователей</Subtitle>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>{item.action}</Title>
            {item.user_email ? <Subtitle>Пользователь: {item.user_email}</Subtitle> : null}
            <Subtitle>{item.created_at}</Subtitle>
            {item.detailsText ? <Subtitle>{item.detailsText}</Subtitle> : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Событий пока нет" />}
      />
    </View>
  );
}
