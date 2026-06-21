import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { DateRangePicker } from '../components/DateRangePicker';
import { ErrorText, LoadingScreen, Subtitle } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { listFuelTransactions, getFuelSyncStatus } from '../api/fuel';
import { listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import type { Driver, FuelTransactionRecord } from '../types';
import { screenUi } from '../styles/screenUi';
import { formatFuelSyncLabel } from '../utils/fuelSyncLabel';
import { withFallback } from '../utils/safeRequest';

interface FuelRefillsScreenProps {
  navigation: { goBack: () => void };
}

/** Deferred: not wired in RootNavigator until Opti integration ships. */
export function FuelRefillsScreen({ navigation }: FuelRefillsScreenProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<FuelTransactionRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [syncLabel, setSyncLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [tx, status, driverList] = await Promise.all([
        listFuelTransactions({
          from: from || undefined,
          to: to || undefined,
          driver_id: driverId ?? undefined,
        }),
        withFallback(() => getFuelSyncStatus(), null),
        isAdmin ? withFallback(() => listDrivers(), []) : Promise.resolve([]),
      ]);
      setItems(tx);
      setDrivers(driverList);
      if (status) {
        setSyncLabel(
          formatFuelSyncLabel(status.last_sync_at, status.last_sync_new_count, status.last_sync_status)
        );
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить заправки'));
    }
  }, [driverId, from, isAdmin, to]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [items]
  );

  if (loading) return <LoadingScreen label="Загрузка заправок…" />;

  return (
    <View style={screenUi.container}>
      <ScreenHeader title="⛽ Заправки Opti" onBack={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[screenUi.content, { paddingBottom: 24 }]}
        ListHeaderComponent={
          <View>
            <ScreenHero
              title="Топливные карты"
              subtitle="Автоимпорт в расходы и финансовые отчёты"
            />
            {syncLabel ? (
              <Text style={{ color: '#64748b', marginBottom: 12, fontSize: 13 }}>{syncLabel}</Text>
            ) : null}
            <ErrorText message={error} />
            <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
            {isAdmin && drivers.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Subtitle>Водитель</Subtitle>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <Text
                    onPress={() => setDriverId(null)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: driverId == null ? '#2563eb' : '#e5e7eb',
                      color: driverId == null ? '#fff' : '#111827',
                    }}
                  >
                    Все
                  </Text>
                  {drivers.map((driver) => (
                    <Text
                      key={driver.id}
                      onPress={() => setDriverId(driver.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: driverId === driver.id ? '#2563eb' : '#e5e7eb',
                        color: driverId === driver.id ? '#fff' : '#111827',
                      }}
                    >
                      {driver.full_name || driver.car_number || `#${driver.id}`}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={[screenUi.card, { marginBottom: 12 }]}>
              <Text style={screenUi.sumLabel}>Итого за период</Text>
              <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{Math.round(totalAmount)} ₽</Text>
              <Text style={{ color: '#64748b', marginTop: 4 }}>{items.length} заправок</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={screenUi.card}>
            <Text style={{ color: '#64748b' }}>
              Заправок пока нет. Администратор привяжет топливные карты и запустит синхронизацию.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[screenUi.card, { marginBottom: 10 }]}>
            <Text style={{ fontWeight: '700', color: '#111827' }}>{item.station_name || 'АЗС'}</Text>
            <Text style={{ color: '#64748b', marginTop: 4 }}>
              {item.transaction_at} · карта {item.card_number}
            </Text>
            <Text style={{ marginTop: 6 }}>
              {item.driver_name || 'Водитель'} · {item.car_number || '—'}
            </Text>
            <Text style={{ marginTop: 8, fontWeight: '700', color: '#ef4444' }}>
              {Math.round(item.amount)} ₽
              {item.liters != null ? ` · ${item.liters} л` : ''}
            </Text>
            {item.expense_id ? (
              <Text style={{ color: '#16a34a', marginTop: 4, fontSize: 12 }}>
                ✓ Учтено в расходах #{item.expense_id}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
