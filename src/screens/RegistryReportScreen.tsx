import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import { listTrips } from '../api/trips';
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

  if (loading && rows.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Реестр рейсов</Title>
            <Subtitle>Разгрузки за период с фильтром по водителю</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Field label="Дата от (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
              <Field label="Дата до (YYYY-MM-DD)" value={to} onChangeText={setTo} />
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
              <Subtitle>Разгрузок: {rows.length}</Subtitle>
              <Subtitle>Общий объём: {totalVolume.toFixed(2)}</Subtitle>
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>Рейс #{item.id} · Заказ #{item.order_id}</Title>
            <Subtitle>{item.created_at}</Subtitle>
            <Subtitle>Водитель: {item.driver_name ?? '—'}</Subtitle>
            {item.driver_car_number ? <Subtitle>Машина: {item.driver_car_number}</Subtitle> : null}
            {item.ttn_number ? <Subtitle>ТТН: {item.ttn_number}</Subtitle> : null}
            {item.volume != null ? <Subtitle>Объём: {item.volume}</Subtitle> : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Данных для реестра нет" />}
      />
    </View>
  );
}
