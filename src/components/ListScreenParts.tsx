import { Pressable, Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { formatMoney } from '../utils/datePeriods';

interface FinanceSummaryBarProps {
  revenue: number;
  paid: number;
  debt: number;
}

export function FinanceSummaryBar({ revenue, paid, debt }: FinanceSummaryBarProps) {
  const debtColor = debt > 0 ? '#ef4444' : '#16a34a';
  return (
    <View style={[screenUi.summaryBar, { marginBottom: 16 }]}>
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>Выручка</Text>
        <Text style={[screenUi.sumValue, { color: '#111827' }]}>{formatMoney(revenue)} ₽</Text>
      </View>
      <View style={screenUi.sumDivider} />
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>Оплачено</Text>
        <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{formatMoney(paid)} ₽</Text>
      </View>
      <View style={screenUi.sumDivider} />
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>Долг</Text>
        <Text style={[screenUi.sumValue, { color: debtColor }]}>{formatMoney(debt)} ₽</Text>
      </View>
    </View>
  );
}

interface EmptyStateButtonProps {
  message: string;
  buttonLabel: string;
  onPress: () => void;
}

export function EmptyStateButton({ message, buttonLabel, onPress }: EmptyStateButtonProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
      <Text style={{ fontSize: 15, color: '#6b7280', marginBottom: 16 }}>{message}</Text>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: '#2563eb',
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
