import { Pressable, Text, View } from 'react-native';

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

export function QuickAccessGrid({ items }: QuickAccessGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={{
            width: '48%',
            backgroundColor: '#ffffff',
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderLeftWidth: 4,
            borderLeftColor: item.color,
          }}
        >
          <Text style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{item.subtitle}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
