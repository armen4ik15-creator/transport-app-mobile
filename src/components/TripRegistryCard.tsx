import { Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { formatMoney } from '../utils/datePeriods';
import type { TripRecord } from '../types';
import { colors } from '../theme';

interface TripRegistryCardProps {
  trip: TripRecord;
}

function tripRevenue(trip: TripRecord): number {
  return (trip.volume ?? 0) * (trip.company_rate ?? 0);
}

export function TripRegistryCard({ trip }: TripRegistryCardProps) {
  const date = (trip.completed_at ?? trip.created_at).slice(0, 10);
  const revenue = tripRevenue(trip);

  return (
    <View style={[screenUi.card, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>📅 {date}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.profit }}>{formatMoney(revenue)} ₽</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
        👤 {trip.driver_name ?? '—'} · 🚚 {trip.driver_car_number ?? '—'}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
        🧱 {trip.material ?? '—'} · ⚖️ {trip.volume ?? 0} {trip.unit ?? 'т'}
      </Text>
      {trip.ttn_number ? (
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>📄 ТТН: {trip.ttn_number}</Text>
      ) : null}
    </View>
  );
}
