import 'react-native-gesture-handler';
import { Alert } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';
import { installGlobalErrorHandler } from './src/utils/installGlobalErrorHandler';
import { logStartup } from './src/utils/startupLogger';

void logStartup('index_entry');

try {
  installGlobalErrorHandler();
  void logStartup('global_error_handler_installed');
  registerRootComponent(App);
  void logStartup('root_component_registered');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack?.slice(0, 400) : '';
  void logStartup('index_register_failed', message);
  Alert.alert(
    'Ошибка запуска',
    `${message}${stack ? `\n\n${stack}` : ''}`,
    [{ text: 'OK' }]
  );
  throw error;
}
