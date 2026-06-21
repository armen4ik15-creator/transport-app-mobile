import { Pressable, Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
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
  const debtColor = debt > 0 ? colors.loss : debt <= 0 ? colors.profit : colors.text;
  return (
    <View style={[screenUi.summaryBar, { marginBottom: 16 }]}>
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>{revenueLabel}</Text>
        <Text style={[screenUi.sumValue, { color: colors.primary }]}>{formatMoney(revenue)} ₽</Text>
      </View>
      <View style={screenUi.sumDivider} />
      <View style={screenUi.sumItem}>
        <Text style={screenUi.sumLabel}>{paidLabel}</Text>
        <Text style={[screenUi.sumValue, { color: colors.profit }]}>{formatMoney(paid)} ₽</Text>
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
  const debtColor = debt > 0 ? colors.loss : colors.profit;
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
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ fontSize, color: colors.textMuted }}>
        📦 Навезли: <Text style={{ fontWeight: '700', color: colors.primary }}>{formatMoney(accrued)} ₽</Text>
      </Text>
      <Text style={{ fontSize, color: colors.textMuted }}>
        💳 Оплатили: <Text style={{ fontWeight: '700', color: colors.profit }}>{formatMoney(paid)} ₽</Text>
      </Text>
      <Text style={{ fontSize, color: colors.textMuted }}>
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
      <Text style={{ fontSize: 15, color: colors.textMuted, marginBottom: 16 }}>{message}</Text>
      <Pressable onPress={onPress} style={screenUi.saveBtn}>
        <Text style={screenUi.saveBtnText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
