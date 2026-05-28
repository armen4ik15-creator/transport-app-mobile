import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  EmptyText,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  Subtitle,
  Title,
} from '../components/ui';
import { apiErrorMessage, getServerHost } from '../api/client';
import { listTrips } from '../api/trips';
import { listDrivers } from '../api/drivers';
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

  if (loading && trips.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Фото ТТН</Title>
            <Subtitle>Фотографии из рейсов с фильтрацией по периоду</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Field
                label="Дата от (YYYY-MM-DD)"
                value={from}
                onChangeText={setFrom}
                placeholder="2026-01-01"
              />
              <Field
                label="Дата до (YYYY-MM-DD)"
                value={to}
                onChangeText={setTo}
                placeholder="2026-12-31"
              />
              <Subtitle>Фильтр по водителю</Subtitle>
              <MenuButton
                label={driverId ? 'Показать всех водителей' : 'Все водители'}
                onPress={() => setDriverId(null)}
                variant="secondary"
              />
              {drivers.map((driver) => (
                <MenuButton
                  key={driver.id}
                  label={`${driverId === driver.id ? '✅ ' : ''}${driver.full_name ?? driver.email}`}
                  onPress={() => setDriverId(driver.id)}
                  variant={driverId === driver.id ? 'default' : 'secondary'}
                />
              ))}
              <MenuButton label="Применить фильтр" onPress={load} variant="secondary" />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              Рейс #{item.id} · Заказ #{item.order_id} · {TRIP_STAGE_LABEL[item.stage]}
            </Subtitle>
            <Subtitle>
              {item.driver_name}
              {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
            </Subtitle>
            <Subtitle>{item.created_at}</Subtitle>
            {item.ttn_number ? <Subtitle>ТТН: {item.ttn_number}</Subtitle> : null}
            <Image
              source={{ uri: `${fileHost}${item.photo_path}` }}
              style={{ width: '100%', height: 220, borderRadius: 8, marginTop: 8 }}
              resizeMode="cover"
            />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Фото ТТН не найдены" />}
      />
    </View>
  );
}
