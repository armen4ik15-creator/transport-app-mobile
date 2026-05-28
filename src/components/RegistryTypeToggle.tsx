import { Pressable, Text, View } from 'react-native';

export type RegistryReportType = 'general' | 'by_vehicle';

interface RegistryTypeToggleProps {
  value: RegistryReportType;
  onChange: (value: RegistryReportType) => void;
}

export function RegistryTypeToggle({ value, onChange }: RegistryTypeToggleProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
        Тип реестра
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => onChange('general')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: value === 'general' ? '#2563eb' : '#e5e7eb',
          }}
        >
          <Text style={{ fontSize: 16 }}>📊</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: value === 'general' ? '#ffffff' : '#374151',
            }}
          >
            Общий
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange('by_vehicle')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: value === 'by_vehicle' ? '#2563eb' : '#e5e7eb',
          }}
        >
          <Text style={{ fontSize: 16 }}>🚚</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: value === 'by_vehicle' ? '#ffffff' : '#374151',
            }}
          >
            По машине
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
