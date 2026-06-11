import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';
import { installGlobalErrorHandler } from './src/utils/installGlobalErrorHandler';
import { logStartup } from './src/utils/startupLogger';

void logStartup('index_entry');
installGlobalErrorHandler();
void logStartup('global_error_handler_installed');

registerRootComponent(App);
void logStartup('root_component_registered');
