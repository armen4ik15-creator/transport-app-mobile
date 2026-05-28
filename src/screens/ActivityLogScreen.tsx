import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listActivity } from '../api/activity';
import { screenUi } from '../styles/screenUi';
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

  if (loading && rows.length === 0) return <LoadingScreen label="Загрузка журнала…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={formatted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📜 Журнал действий" />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Событий</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{rows.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{item.action}</Text>
            {item.user_email ? (
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>👤 {item.user_email}</Text>
            ) : null}
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.created_at}</Text>
            {item.detailsText ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 6, fontStyle: 'italic' }}>
                {item.detailsText}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Событий пока нет</Text>}
      />
    </View>
  );
}
