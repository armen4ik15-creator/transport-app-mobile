import { Pressable, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

export interface QuickAccessItem {
  icon: string;
  title: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
}

interface QuickAccessGridProps {
  items: QuickAccessItem[];
}

/** v0-style 4-column quick access grid with card tiles. */
export function QuickAccessGrid({ items }: QuickAccessGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={{
            width: '23%',
            minWidth: 76,
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: 4,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.sm,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.md,
              backgroundColor: `${item.color}26`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: colors.textMuted,
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
