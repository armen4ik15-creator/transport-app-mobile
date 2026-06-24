import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface NetworkIssueBannerProps {
  visible: boolean;
  onRetry: () => void;
}

export function NetworkIssueBanner({ visible, onRetry }: NetworkIssueBannerProps) {
  if (!visible) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Нет связи с сервером</Text>
      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Повторить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.loss,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
