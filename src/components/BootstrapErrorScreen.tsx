import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './ui';

interface BootstrapErrorScreenProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function BootstrapErrorScreen({
  message,
  onRetry,
  retrying = false,
}: BootstrapErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Не удалось запустить приложение</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>
        Проверьте интернет и повторите. Если ошибка повторяется — переустановите APK или
        пришлите логи администратору.
      </Text>
      <PrimaryButton label="Повторить" onPress={onRetry} loading={retrying} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fef2f2',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b91c1c',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#1c1c1e',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 18,
  },
});
