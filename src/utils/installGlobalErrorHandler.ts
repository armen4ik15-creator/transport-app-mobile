import { Alert } from 'react-native';
import { logStartup } from './startupLogger';

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler: () => GlobalErrorHandler;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
}

let lastAlertMessage = '';

function showFatalAlert(title: string, message: string): void {
  if (message === lastAlertMessage) return;
  lastAlertMessage = message;
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/** RN 0.76+ no longer exports ErrorUtils from 'react-native'; it lives on global. */
function resolveErrorUtils(): ErrorUtilsLike | null {
  const globalScope = globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike };

  const fromGlobal = globalScope.ErrorUtils;
  if (
    fromGlobal &&
    typeof fromGlobal.getGlobalHandler === 'function' &&
    typeof fromGlobal.setGlobalHandler === 'function'
  ) {
    return fromGlobal;
  }

  try {
    const reactNative = require('react-native') as { ErrorUtils?: ErrorUtilsLike };
    const fromModule = reactNative.ErrorUtils;
    if (
      fromModule &&
      typeof fromModule.getGlobalHandler === 'function' &&
      typeof fromModule.setGlobalHandler === 'function'
    ) {
      return fromModule;
    }
  } catch {
    // react-native not ready yet
  }

  return null;
}

export function installGlobalErrorHandler(): boolean {
  const errorUtils = resolveErrorUtils();
  if (!errorUtils) {
    void logStartup('global_error_handler_skipped', 'ErrorUtils unavailable');
    return false;
  }

  const defaultHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    void logStartup('unhandled_js_error', `${error.message} fatal=${Boolean(isFatal)}`);

    if (isFatal) {
      showFatalAlert(
        'Критическая ошибка',
        `${error.message}${error.stack ? `\n\n${error.stack.slice(0, 1500)}` : ''}`
      );
    }

    defaultHandler(error, isFatal);
  });

  return true;
}
