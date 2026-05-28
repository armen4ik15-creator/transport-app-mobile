import { Pressable, ScrollView, Text } from 'react-native';
import { screenUi } from '../styles/screenUi';

export interface FilterChipItem<T extends string> {
  id: T;
  label: string;
}

interface FilterChipRowProps<T extends string> {
  items: FilterChipItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

export function FilterChipRow<T extends string>({
  items,
  activeId,
  onSelect,
}: FilterChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={screenUi.filterRow}
      contentContainerStyle={screenUi.filterRowContent}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[screenUi.chip, active && screenUi.chipActive]}
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
