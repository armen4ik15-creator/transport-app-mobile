import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage, getServerHost } from '../api/client';
import { listTrips } from '../api/trips';
import { listDrivers } from '../api/drivers';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import { TRIP_STAGE_LABEL, type Driver, type TripRecord } from '../types';

export function TripPhotosScreen() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fileHost, setFileHost] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getServerHost().then(setFileHost).catch(() => setFileHost('http://localhost:3000'));
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [tripData, driverData] = await Promise.all([
        withFallback(
          () =>
            listTrips({
              driver_id: driverId ?? undefined,
              from: from.trim() || undefined,
              to: to.trim() || undefined,
            }),
          []
        ),
        withFallback(() => listDrivers(), []),
      ]);
      setDrivers(driverData);
      setTrips(tripData.filter((trip) => Boolean(trip.photo_path)));
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить фото ТТН'));
    }
  }, [driverId, from, to]);

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

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  if (loading && trips.length === 0) return <LoadingScreen label="Загрузка фото…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📷 Фото ТТН" />
            <ScreenHero title="🖼 Фото накладных" subtitle="Просмотр и сохранение ТТН" />
            <Field label="Дата от (YYYY-MM-DD)" value={from} onChangeText={setFrom} placeholder="2026-01-01" />
            <Field label="Дата до (YYYY-MM-DD)" value={to} onChangeText={setTo} placeholder="2026-12-31" />
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={driverId == null ? 'all' : String(driverId)}
              onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
            />
            <MenuButton label="🔍 Применить фильтр" onPress={load} variant="secondary" />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Фото</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{trips.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
              Рейс #{item.id} · Заказ #{item.order_id} · {TRIP_STAGE_LABEL[item.stage]}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              👤 {item.driver_name}
              {item.driver_car_number ? ` · 🚚 ${item.driver_car_number}` : ''}
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.created_at}</Text>
            {item.ttn_number ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📄 ТТН: {item.ttn_number}</Text>
            ) : null}
            <Image
              source={{ uri: `${fileHost}${item.photo_path}` }}
              style={{ width: '100%', height: 220, borderRadius: 8, marginTop: 8 }}
              resizeMode="cover"
            />
          </View>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Фото ТТН не найдены</Text>}
      />
    </View>
  );
}
