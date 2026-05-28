import { Text, View } from 'react-native';

interface InfoBannerProps {
  text: string;
}

export function InfoBanner({ text }: InfoBannerProps) {
  return (
    <View
      style={{
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 16 }}>ℹ️</Text>
      <Text style={{ flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 }}>{text}</Text>
    </View>
  );
}
