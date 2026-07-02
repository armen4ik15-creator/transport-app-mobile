import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import {
  isLicenseAccepted,
  markLicenseAccepted,
  SecurityMonitor,
} from './src/components/SecurityMonitor';
import { LicenseAgreementScreen } from './src/screens/LicenseAgreementScreen';
import { logStartup } from './src/utils/startupLogger';
import { installGlobalErrorHandler } from './src/utils/installGlobalErrorHandler';
import { runAntiDebugCheck } from './src/utils/antiDebug';

function AppShell() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <SecurityMonitor>
          <StatusBar style="dark" />
          <RootNavigator />
        </SecurityMonitor>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [licenseAccepted, setLicenseAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    void logStartup('app_mount');
    installGlobalErrorHandler();
    void runAntiDebugCheck();

    void isLicenseAccepted().then((accepted) => {
      setLicenseAccepted(accepted);
    });

    const frame = requestAnimationFrame(() => {
      setReady(true);
      void logStartup('app_ready');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready || licenseAccepted === null) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootText}>Loading...</Text>
      </View>
    );
  }

  if (!licenseAccepted) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <LicenseAgreementScreen
            onAccept={() => {
              void markLicenseAccepted().then(() => setLicenseAccepted(true));
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
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
    backgroundColor: '#121212',
  },
  bootText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
