import { Pressable, Text, View } from 'react-native';
import { IconBadge } from '../ui-kit';
import { colors, radii, spacing } from '../../theme';
import type { UiTone } from '../ui-kit';

interface StatSummaryCardProps {
  label: string;
  value: string;
  accentColor: string;
  icon: string;
  tone?: UiTone;
  onPress?: () => void;
}

export function StatSummaryCard({
  label,
  value,
  accentColor,
  icon,
  tone = 'info',
  onPress,
}: StatSummaryCardProps) {
  const content = (
    <>
      <IconBadge icon={icon} tone={tone} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: accentColor }} numberOfLines={1}>
          {value}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </>
  );

  const boxStyle = {
    width: '48%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={boxStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={boxStyle}>{content}</View>;
}
