import { Pressable, Text, TextInput, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Поиск…',
}: SearchBarProps) {
  return (
    <View style={screenUi.searchContainer}>
      <Text style={{ fontSize: 16 }}>🔍</Text>
      <TextInput
        style={screenUi.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
