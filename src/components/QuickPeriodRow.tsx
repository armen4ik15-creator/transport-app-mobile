import { Pressable, ScrollView, Text } from 'react-native';
import { screenUi } from '../styles/screenUi';

interface QuickPeriodRowProps<T extends string> {
  items: { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
}

export function QuickPeriodRow<T extends string>({
  items,
  activeId,
  onSelect,
}: QuickPeriodRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 12 }}
      contentContainerStyle={screenUi.filterRowContent}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[
              screenUi.chip,
              active && screenUi.chipActive,
              { paddingHorizontal: 16, paddingVertical: 10 },
            ]}
          >
            <Text style={[screenUi.chipText, active && screenUi.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
