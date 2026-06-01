import { Pressable, Text, View } from 'react-native';

export interface HubMenuCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  accentColor: string;
  onPress: () => void;
  danger?: boolean;
}

export function HubMenuCard({ icon, title, subtitle, accentColor, onPress, danger }: HubMenuCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: danger ? '#fef2f2' : '#ffffff',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: danger ? '#fecaca' : '#e5e7eb',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: accentColor }} />
      <Text style={{ fontSize: 28, marginLeft: 14, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1, paddingVertical: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: danger ? '#b91c1c' : '#111827' }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 20, color: '#9ca3af', marginRight: 14 }}>›</Text>
    </Pressable>
  );
}
