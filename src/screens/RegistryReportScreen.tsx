import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { FilterChipRow } from '../components/FilterChipRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listTrips } from '../api/trips';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import type { Driver, TripRecord } from '../types';

export function RegistryReportScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [driversData, tripsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(
          () =>
            listTrips({
              driver_id: driverId ?? undefined,
              from: from.trim() || undefined,
              to: to.trim() || undefined,
            }),
          []
        ),
      ]);
      setDrivers(driversData);
      setRows(tripsData.filter((item) => item.stage === 'unloading'));
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить реестр'));
    }
  }, [driverId, from, to]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalVolume = useMemo(
    () => rows.reduce((sum, row) => sum + (row.volume ?? 0), 0),
    [rows]
  );

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  if (loading && rows.length === 0) return <LoadingScreen label="Загрузка реестра…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📑 Реестр рейсов" showBack={false} />
            <Field label="Дата от (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
            <Field label="Дата до (YYYY-MM-DD)" value={to} onChangeText={setTo} />
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={driverId == null ? 'all' : String(driverId)}
              onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
            />
            <MenuButton label="🔍 Применить фильтр" onPress={load} variant="secondary" />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Разгрузок</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{rows.length}</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Объём</Text>
                <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{totalVolume.toFixed(2)}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
              Рейс #{item.id} · Заказ #{item.order_id}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.created_at}</Text>
            <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>
              👤 {item.driver_name ?? '—'}
              {item.driver_car_number ? ` · 🚚 ${item.driver_car_number}` : ''}
            </Text>
            {item.ttn_number ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📄 ТТН: {item.ttn_number}</Text>
            ) : null}
            {item.volume != null ? (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 }}>
                ⚖️ {item.volume}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Данных для реестра нет</Text>}
      />
    </View>
  );
}
