import { Alert, ErrorUtils } from 'react-native';
import { logStartup } from './startupLogger';

let lastAlertMessage = '';

function showFatalAlert(title: string, message: string): void {
  if (message === lastAlertMessage) return;
  lastAlertMessage = message;
  Alert.alert(title, message, [{ text: 'OK' }]);
}

export function installGlobalErrorHandler(): void {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const detail = `${error.message}${error.stack ? `\n${error.stack.slice(0, 400)}` : ''}`;
    void logStartup('unhandled_js_error', `${error.message} fatal=${Boolean(isFatal)}`);

    if (isFatal) {
      showFatalAlert(
        'Критическая ошибка',
        `${error.message}${error.stack ? `\n\n${error.stack.slice(0, 1500)}` : ''}`
      );
    }

    defaultHandler(error, isFatal);
  });
}
