import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BlockedScreen } from '../screens/BlockedScreen';
import {
  initHeartbeatBlockedBridge,
  startHeartbeat,
  stopHeartbeat,
} from '../utils/heartbeat';
import { hasDeviceCredentials } from '../utils/cryptoBundle';
import { registerDeviceWithServer } from '../api/device';
import { runAntiDebugCheck } from '../utils/antiDebug';

interface SecurityMonitorProps {
  children: ReactNode;
}

export function SecurityMonitor({ children }: SecurityMonitorProps) {
  const { user, signOut } = useAuth();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const handleBlocked = useCallback(
    (reason: string) => {
      setBlockedReason(reason);
      stopHeartbeat();
      void signOut();
    },
    [signOut],
  );

  useEffect(() => {
    initHeartbeatBlockedBridge(handleBlocked);
    void runAntiDebugCheck();
  }, [handleBlocked]);

  useEffect(() => {
    if (!user) {
      stopHeartbeat();
      return;
    }

    let cancelled = false;

    const bootstrapSecurity = async () => {
      setInitializing(true);
      try {
        const hasCredentials = await hasDeviceCredentials();
        if (!hasCredentials) {
          await registerDeviceWithServer();
        }
        if (!cancelled) {
          startHeartbeat();
        }
      } catch {
        // Регистрация устройства не должна блокировать вход — HMAC включится при успехе
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    void bootstrapSecurity();

    return () => {
      cancelled = true;
      stopHeartbeat();
    };
  }, [user]);

  if (blockedReason) {
    return <BlockedScreen reason={blockedReason} onSignOut={signOut} />;
  }

  if (user && initializing) {
    return null;
  }

  return <>{children}</>;
}

export const LICENSE_ACCEPTED_KEY = 'reestrpro.license.accepted';

export async function isLicenseAccepted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(LICENSE_ACCEPTED_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markLicenseAccepted(): Promise<void> {
  try {
    await AsyncStorage.setItem(LICENSE_ACCEPTED_KEY, '1');
  } catch {
    // ignore
  }
}
