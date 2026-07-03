import { StyleSheet, Text, View } from 'react-native';

interface HmacRecoveryBannerProps {
  visible: boolean;
}

export function HmacRecoveryBanner({ visible }: HmacRecoveryBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Восстанавливаю подключение…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fefce8',
    borderBottomWidth: 1,
    borderBottomColor: '#fde047',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    color: '#854d0e',
    fontSize: 14,
    fontWeight: '600',
  },
});
