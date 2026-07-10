import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DateRangePicker } from '../components/DateRangePicker';
import { FilterChipRow } from '../components/FilterChipRow';
import { RemoteImage } from '../components/RemoteImage';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listTrips, hasTripPhoto, isTripPhotoMissingOnServer } from '../api/trips';
import { listDrivers } from '../api/drivers';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { withFallback } from '../utils/safeRequest';
import { TRIP_STAGE_LABEL, type Driver, type TripRecord } from '../types';

function yearBounds(): { from: string; to: string } {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function TripPhotosScreen() {
  const initial = yearBounds();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setTrips(tripData.filter((trip) => Boolean(trip.photo_path && trip.photo_path.trim())));
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📷 Фото ТТН" />

            <CollapsiblePanel title="Фильтры" subtitle={`${trips.length} фото`} defaultExpanded>
              <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
              <Text style={screenUi.filterLabel}>Водитель:</Text>
              <FilterChipRow
                items={driverChips}
                activeId={driverId == null ? 'all' : String(driverId)}
                onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
              />
              <MenuButton label="🔍 Применить фильтр" onPress={load} variant="secondary" />
            </CollapsiblePanel>

            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Фото</Text>
                <Text style={[screenUi.sumValue, { color: colors.primary }]}>{trips.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={screenUi.cardTitleSm}>
              Рейс #{item.id} · Заказ #{item.order_id} · {TRIP_STAGE_LABEL[item.stage]}
            </Text>
            <Text style={screenUi.cardMeta}>
              👤 {item.driver_name}
              {item.driver_car_number ? ` · 🚚 ${item.driver_car_number}` : ''}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.created_at}</Text>
            {item.ttn_number ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                📄 ТТН: {item.ttn_number}
              </Text>
            ) : null}
            {isTripPhotoMissingOnServer(item) ? (
              <Text style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                ⚠️ Файл на сервере отсутствует — прикрепите заново в рейсе
              </Text>
            ) : null}
            {hasTripPhoto(item) && item.photo_path ? (
              <RemoteImage
                filePath={item.photo_path}
                style={{ width: '100%', height: 220, borderRadius: 8, marginTop: 8 }}
                resizeMode="cover"
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Фото ТТН не найдены</Text>}
      />
    </View>
  );
}
