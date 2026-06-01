import { Pressable, Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { formatMoney } from '../utils/datePeriods';

interface FinanceSummaryBarProps {
  revenue: number;
  paid: number;
  debt: number;
  revenueLabel?: string;
  paidLabel?: string;
  debtLabel?: string;
}

export function FinanceSummaryBar({
  revenue,
  paid,
  debt,
  revenueLabel = 'Выручка',
  paidLabel = 'Оплачено',
  debtLabel = 'Долг',
}: FinanceSummaryBarProps) {
  const debtColor = debt > 0 ? '#ef4444' : debt <= 0 ? '#16a34a' : '#111827';
  return (
    <View style={[screenUi.summaryBar, { marginBottom: 16 }]}>
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>{revenueLabel}</Text>
        <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{formatMoney(revenue)} ₽</Text>
      </View>
      <View style={screenUi.sumDivider} />
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>{paidLabel}</Text>
        <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{formatMoney(paid)} ₽</Text>
      </View>
      <View style={screenUi.sumDivider} />
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>{debtLabel}</Text>
        <Text style={[screenUi.sumValue, { color: debtColor }]}>{formatMoney(debt)} ₽</Text>
      </View>
    </View>
  );
}

interface ContractorFinanceRowProps {
  accrued: number;
  paid: number;
  debt: number;
  compact?: boolean;
}

export function ContractorFinanceRow({ accrued, paid, debt, compact = false }: ContractorFinanceRowProps) {
  const debtColor = debt > 0 ? '#ef4444' : '#16a34a';
  const fontSize = compact ? 12 : 13;
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: compact ? 6 : 8,
        marginTop: compact ? 8 : 0,
        paddingTop: compact ? 8 : 0,
        borderTopWidth: compact ? 1 : 0,
        borderTopColor: '#f3f4f6',
      }}
    >
      <Text style={{ fontSize, color: '#4b5563' }}>
        📦 Навезли: <Text style={{ fontWeight: '700', color: '#2563eb' }}>{formatMoney(accrued)} ₽</Text>
      </Text>
      <Text style={{ fontSize, color: '#4b5563' }}>
        💳 Оплатили: <Text style={{ fontWeight: '700', color: '#16a34a' }}>{formatMoney(paid)} ₽</Text>
      </Text>
      <Text style={{ fontSize, color: '#4b5563' }}>
        ⚖️ Долг: <Text style={{ fontWeight: '700', color: debtColor }}>{formatMoney(debt)} ₽</Text>
      </Text>
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
