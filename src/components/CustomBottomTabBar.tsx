import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from './TabBarIcon';
import { colors, radii } from '../theme';

export interface BottomTabItem<T extends string> {
  id: T;
  label: string;
  emoji: string;
}

interface CustomBottomTabBarProps<T extends string> {
  items: BottomTabItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

/** Нижняя навигация в стиле transport-company-app-ref. */
export function CustomBottomTabBar<T extends string>({
  items,
  activeId,
  onSelect,
}: CustomBottomTabBarProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 6,
        paddingHorizontal: 4,
        flexDirection: 'row',
      }}
    >
      {items.map((item) => {
        const focused = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 6,
              paddingHorizontal: 2,
              borderRadius: radii.md,
              backgroundColor: focused ? colors.primaryMuted : 'transparent',
            }}
          >
            <TabBarIcon emoji={item.emoji} focused={focused} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? colors.primaryLight : colors.textMuted,
                marginTop: 2,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
