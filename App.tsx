import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { logStartup } from './src/utils/startupLogger';

export default function App() {
  useEffect(() => {
    void logStartup('app_mount');
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
