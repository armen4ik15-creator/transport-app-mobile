import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radii, spacing } from '../../theme';

export function V0IconField({
  icon,
  ...props
}: { icon: string } & TextInputProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.input,
        paddingHorizontal: 14,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 10, opacity: 0.85 }}>{icon}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text }}
        {...props}
      />
    </View>
  );
}

export function V0DashboardHeader({
  title,
  subtitle,
  badge,
  onNotifications,
  onLogout,
  initials,
}: {
  title: string;
  subtitle?: string;
  badge?: number;
  onNotifications?: () => void;
  onLogout?: () => void;
  initials?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {onNotifications ? (
          <Pressable
            onPress={onNotifications}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {badge != null && badge > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.loss,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        {onLogout ? (
          <Pressable
            onPress={onLogout}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primaryLight }}>
              {initials ?? 'RP'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function V0OptiBanner() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryMuted,
        borderWidth: 1,
        borderColor: `${colors.primary}4D`,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ fontSize: 18 }}>🔄</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Синхронизация Opti</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          Топливные транзакции (при наличии интеграции)
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.profitMuted,
          borderRadius: radii.full,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.profit }}>Активно</Text>
      </View>
    </View>
  );
}

function formatRub(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function PnLColumn({
  period,
  revenue,
  costs,
  profit,
}: {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
}) {
  const positive = profit >= 0;
  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{period}</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: positive ? colors.profit : colors.loss,
          marginTop: 8,
        }}
      >
        {formatRub(profit)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>прибыль</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
        Выручка {formatRub(revenue)}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
        Расходы {formatRub(costs)}
      </Text>
    </View>
  );
}

export function V0PnLCard({
  today,
  month,
}: {
  today: { revenue: number; costs: number; profit: number };
  month: { revenue: number; costs: number; profit: number };
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <PnLColumn period="Сегодня" {...today} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <PnLColumn period="За месяц" {...month} />
      </View>
    </View>
  );
}

export function V0QuickCard({
  icon,
  label,
  value,
  tone = 'info',
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  tone?: 'info' | 'danger' | 'warning';
  onPress?: () => void;
}) {
  const bg =
    tone === 'danger' ? colors.lossMuted : tone === 'warning' ? colors.warningMuted : colors.primaryMuted;
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 }}>{value}</Text>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

export function V0SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{children}</Text>
      {action}
    </View>
  );
}
