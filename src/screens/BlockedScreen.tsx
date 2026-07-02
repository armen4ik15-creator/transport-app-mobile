import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface BlockedScreenProps {
  reason: string;
  onSignOut?: () => void;
}

export function BlockedScreen({ reason, onSignOut }: BlockedScreenProps) {
  const handleSignOut = useCallback(() => {
    onSignOut?.();
  }, [onSignOut]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚫</Text>
      <Text style={styles.title}>Доступ заблокирован</Text>
      <Text style={styles.reason}>{reason}</Text>
      <Text style={styles.hint}>
        Обратитесь к администратору ReestrPro, если считаете это ошибкой.
      </Text>
      {onSignOut ? (
        <Pressable style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Выйти из аккаунта</Text>
        </Pressable>
      ) : (
        <ActivityIndicator color="#fff" style={styles.loader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  reason: {
    fontSize: 16,
    color: '#ffb4b4',
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  loader: {
    marginTop: 8,
  },
});
