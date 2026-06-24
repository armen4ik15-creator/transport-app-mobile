import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from './ui';
import { logStartup } from '../utils/startupLogger';
import { colors } from '../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AppErrorBoundary:', error.message, info.componentStack);
    void logStartup('error_boundary', `${error.message} | ${info.componentStack?.slice(0, 200) ?? ''}`);
    const componentStack = info.componentStack?.trim() ?? '';
    Alert.alert(
      'Ошибка приложения',
      `${error.message}${componentStack ? `\n\n${componentStack.slice(0, 1500)}` : ''}`,
      [{ text: 'OK' }]
    );
  }

  private onRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Ошибка приложения</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.hint}>
            Попробуйте повторить. Если не помогает — переустановите APK или отправьте логи
            администратору (см. STARTUP-DEBUG.md, adb logcat).
          </Text>
          <PrimaryButton label="Повторить" onPress={this.onRetry} />
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 18,
  },
});
