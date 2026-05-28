import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from './TabBarIcon';

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

export function CustomBottomTabBar<T extends string>({
  items,
  activeId,
  onSelect,
}: CustomBottomTabBarProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: Math.max(insets.bottom, 6),
        paddingTop: 4,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {items.map((item) => {
          const focused = item.id === activeId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={{
                minWidth: 72,
                alignItems: 'center',
                paddingHorizontal: 6,
                paddingVertical: 4,
              }}
            >
              <TabBarIcon emoji={item.emoji} focused={focused} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  marginTop: 2,
                  color: focused ? '#1a5fb4' : '#6b7280',
                  maxWidth: 68,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
