import { Pressable, Text, View } from 'react-native';
import { formatMoney } from '../utils/datePeriods';
import type { ReportDailyRow } from '../api/reports';
import { screenUi } from '../styles/screenUi';

interface DailyReportCardProps {
  row: ReportDailyRow;
  selected?: boolean;
  onPress?: () => void;
}

function formatDayLabel(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function DailyReportCard({ row, selected, onPress }: DailyReportCardProps) {
  const profitColor = row.profit >= 0 ? '#16a34a' : '#ef4444';

  return (
    <Pressable
      onPress={onPress}
      style={[
        screenUi.card,
        {
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: selected ? '#2563eb' : profitColor,
          backgroundColor: selected ? '#eff6ff' : '#ffffff',
          marginBottom: 10,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{formatDayLabel(row.date)}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            🚛 {row.trips_count} рейс{row.trips_count === 1 ? '' : row.trips_count < 5 ? 'а' : 'ов'}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: profitColor }}>{formatMoney(row.profit)} ₽</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <MetricPill label="Выручка" value={row.revenue} color="#16a34a" />
        <MetricPill label="Расходы" value={row.expenses + row.driver_pay} color="#ef4444" />
      </View>
    </Pressable>
  );
}

function MetricPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
    >
      <Text style={{ fontSize: 10, color: '#6b7280' }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{formatMoney(value)} ₽</Text>
    </View>
  );
}
