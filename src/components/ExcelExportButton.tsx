import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../theme';

interface ExcelExportButtonProps {
  label?: string;
  loading?: boolean;
  onPress: () => void;
}

export function ExcelExportButton({
  label = '📥 Скачать Excel',
  loading = false,
  onPress,
}: ExcelExportButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: colors.profit,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>{label}</Text>
      )}
    </Pressable>
  );
}
