import { Pressable, Text, View } from 'react-native';
import { formatMoney } from '../utils/datePeriods';
import type { ReportDailyRow } from '../api/reports';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

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
  const profitColor = row.profit >= 0 ? colors.profit : colors.loss;

  return (
    <Pressable
      onPress={onPress}
      style={[
        screenUi.card,
        {
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: selected ? colors.primary : profitColor,
          backgroundColor: selected ? colors.primaryMuted : colors.surface,
          marginBottom: 10,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={screenUi.cardTitleSm}>{formatDayLabel(row.date)}</Text>
          <Text style={screenUi.cardMeta}>
            🚛 {row.trips_count} рейс{row.trips_count === 1 ? '' : row.trips_count < 5 ? 'а' : 'ов'}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: profitColor }}>{formatMoney(row.profit)} ₽</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <MetricPill label="Выручка" value={row.revenue} accentColor={colors.profit} />
        <MetricPill label="Расходы" value={row.expenses + row.driver_pay} accentColor={colors.loss} />
      </View>
    </Pressable>
  );
}

function MetricPill({ label, value, accentColor }: { label: string; value: number; accentColor: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>{formatMoney(value)} ₽</Text>
    </View>
  );
}
