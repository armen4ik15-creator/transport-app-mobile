import { Pressable, Text, View } from 'react-native';

interface FilterDropdownProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}

export function FilterDropdown({ icon, label, active, onPress }: FilterDropdownProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: active ? '#2563eb' : '#bfdbfe',
        backgroundColor: active ? '#eff6ff' : '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, color: '#111827', fontWeight: '500', flex: 1 }}
        >
          {label}
        </Text>
      </View>
      <Text style={{ color: '#6b7280', fontSize: 12 }}>▾</Text>
    </Pressable>
  );
}
