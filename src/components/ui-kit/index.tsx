import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme';

export type UiTone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

const toneColors: Record<UiTone, { bg: string; text: string }> = {
  neutral: { bg: colors.surfaceElevated, text: colors.textMuted },
  positive: { bg: `${colors.profit}26`, text: colors.profit },
  warning: { bg: `${colors.warning}26`, text: colors.warning },
  danger: { bg: `${colors.loss}26`, text: colors.loss },
  info: { bg: `${colors.primary}26`, text: colors.primary },
};

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: UiTone;
}) {
  const palette = toneColors[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: palette.bg,
        borderRadius: radii.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: palette.text }}>{children}</Text>
    </View>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        paddingHorizontal: 2,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{children}</Text>
      {action}
    </View>
  );
}

export function IconBadge({ icon, tone = 'info' }: { icon: string; tone?: UiTone }) {
  const palette = toneColors[tone];
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: UiTone;
}) {
  const palette = toneColors[tone];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

export function ProgressBar({
  value,
  tone = 'positive',
}: {
  value: number;
  tone?: 'positive' | 'warning' | 'danger' | 'info';
}) {
  const fillColor =
    tone === 'positive'
      ? colors.profit
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.loss
          : colors.primary;
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <View
      style={{
        height: 6,
        width: '100%',
        borderRadius: radii.full,
        backgroundColor: colors.surfaceElevated,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: fillColor, borderRadius: radii.full }} />
    </View>
  );
}

export function Fab({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          position: 'absolute',
          right: spacing.md,
          bottom: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: radii.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: 14,
          elevation: 6,
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function HubListRow({
  icon,
  title,
  subtitle,
  tone = 'info',
  badge,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  tone?: UiTone;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: 10,
        paddingHorizontal: 4,
      }}
    >
      <IconBadge icon={icon} tone={tone} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge != null && badge > 0 ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.loss,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{badge}</Text>
        </View>
      ) : null}
      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

export function PrimaryBanner({
  icon,
  title,
  subtitle,
  tone = 'info',
}: {
  icon: string;
  title: string;
  subtitle?: string;
  tone?: 'info' | 'success' | 'warning';
}) {
  const borderColor =
    tone === 'success' ? colors.profit : tone === 'warning' ? colors.warning : colors.primary;
  const bgColor =
    tone === 'success' ? colors.profitMuted : tone === 'warning' ? colors.warningMuted : colors.primaryMuted;

  return (
    <View
      style={{
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: `${borderColor}4D`,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
      }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
