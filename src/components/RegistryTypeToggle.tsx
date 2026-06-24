import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';

export type RegistryReportType = 'general' | 'by_vehicle';

interface RegistryTypeToggleProps {
  value: RegistryReportType;
  onChange: (value: RegistryReportType) => void;
}

export function RegistryTypeToggle({ value, onChange }: RegistryTypeToggleProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>
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
            backgroundColor: value === 'general' ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: 16 }}>📊</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: value === 'general' ? '#ffffff' : colors.textMuted,
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
            backgroundColor: value === 'by_vehicle' ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: 16 }}>🚚</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: value === 'by_vehicle' ? '#ffffff' : colors.textMuted,
            }}
          >
            По машине
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
