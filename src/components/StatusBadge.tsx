import { Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
  color: string;
  backgroundColor?: string;
}

export function StatusBadge({ label, color, backgroundColor }: StatusBadgeProps) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: backgroundColor ?? `${color}18`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: `${color}40`,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}
