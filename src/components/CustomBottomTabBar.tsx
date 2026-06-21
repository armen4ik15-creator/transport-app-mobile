import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from './TabBarIcon';
import { colors } from '../theme';

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

/** v0-style bottom navigation: equal-width tabs, primary accent on active. */
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
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
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
              paddingVertical: 4,
              gap: 4,
            }}
          >
            <TabBarIcon emoji={item.emoji} focused={focused} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontWeight: focused ? '700' : '500',
                color: focused ? colors.primary : colors.textMuted,
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
