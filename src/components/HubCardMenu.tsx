import { Pressable, ScrollView, Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';

export interface HubCardItem {
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
  onPress: () => void;
}

interface HubCardMenuProps {
  title: string;
  subtitle?: string;
  items: HubCardItem[];
}

export function HubCardMenu({ title, subtitle, items }: HubCardMenuProps) {
  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          backgroundColor: '#1e3a5f',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#ffffff' }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4 }}>{subtitle}</Text>
        ) : null}
      </View>

      {items.map((item) => (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: item.accentColor }} />
          <Text style={{ fontSize: 28, marginLeft: 14, marginRight: 12 }}>{item.icon}</Text>
          <View style={{ flex: 1, paddingVertical: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{item.title}</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{item.subtitle}</Text>
          </View>
          <Text style={{ fontSize: 20, color: '#9ca3af', marginRight: 14 }}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
