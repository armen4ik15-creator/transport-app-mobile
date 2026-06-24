import { Pressable, Text, View } from 'react-native';
import type { Order } from '../../types';
import { Pill } from '../ui-kit';
import { colors, radii, spacing } from '../../theme';

interface RecentOrderRowProps {
  order: Order;
  onPress: () => void;
}

export function RecentOrderRow({ order, onPress }: RecentOrderRowProps) {
  const statusLabel = order.is_active ? 'В работе' : 'Завершён';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
          Заказ №{order.id}
        </Text>
        <Pill tone={order.is_active ? 'warning' : 'neutral'}>{statusLabel}</Pill>
      </View>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }} numberOfLines={2}>
        {order.contractor_name ?? 'Контрагент'} · {order.material ?? order.task_name ?? 'Груз'}
      </Text>
      {(order.load_address || order.unload_address) && (
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }} numberOfLines={1}>
          {order.load_address ?? '—'} → {order.unload_address ?? '—'}
        </Text>
      )}
    </Pressable>
  );
}
