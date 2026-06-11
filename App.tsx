import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { logStartup } from './src/utils/startupLogger';

function AppShell() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void logStartup('app_mount');
    const frame = requestAnimationFrame(() => {
      setReady(true);
      void logStartup('app_ready');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6f8',
  },
  bootText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
});
