import { ScrollView, Text, View } from 'react-native';
import type { TripRecord } from '../types';
import { formatMoney } from '../utils/datePeriods';
import { colors } from '../theme';

interface RegistryPreviewTableProps {
  rows: TripRecord[];
  maxRows?: number;
}

function tripRevenue(row: TripRecord): number {
  return (row.volume ?? 0) * (row.company_rate ?? 0);
}

export function RegistryPreviewTable({ rows, maxRows = 8 }: RegistryPreviewTableProps) {
  const visible = rows.slice(0, maxRows);

  if (rows.length === 0) {
    return (
      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 12 }}>
        Нет завершённых разгрузок за выбранный период
      </Text>
    );
  }

  const totalRevenue = rows.reduce((sum, row) => sum + tripRevenue(row), 0);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>
        Превью реестра ({rows.length} разгрузок)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={{ flexDirection: 'row', backgroundColor: '#e8eef7', borderRadius: 8 }}>
            {['Дата', 'ТН', 'Машина', 'Водитель', 'Материал', 'Объём', 'Выручка'].map((col) => (
              <Text
                key={col}
                style={{
                  width: 100,
                  padding: 8,
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.textMuted,
                }}
              >
                {col}
              </Text>
            ))}
          </View>
          {visible.map((row) => (
            <View
              key={row.id}
              style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surfaceElevated }}
            >
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {(row.completed_at ?? row.created_at).slice(0, 10)}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {row.ttn_number ?? '—'}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {row.driver_car_number ?? '—'}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {row.driver_name ?? '—'}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {row.material ?? '—'}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.text }}>
                {row.volume ?? 0}
              </Text>
              <Text style={{ width: 100, padding: 8, fontSize: 11, color: colors.profit }}>
                {formatMoney(tripRevenue(row))} ₽
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      {rows.length > maxRows ? (
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
          … и ещё {rows.length - maxRows} строк (полный список — в Excel)
        </Text>
      ) : null}
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.profit, marginTop: 10 }}>
        Итого выручка: {formatMoney(totalRevenue)} ₽
      </Text>
    </View>
  );
}
