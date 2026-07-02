import { NativeModules, Platform } from 'react-native';

interface AntiDebugNativeModule {
  isDebuggerConnected?: () => Promise<boolean>;
}

const nativeModule = NativeModules.AntiDebugModule as AntiDebugNativeModule | undefined;

function hasRemoteDevHook(): boolean {
  const globalObj = global as typeof global & {
    __REMOTEDEV__?: unknown;
    nativeCallSyncHook?: unknown;
  };
  return Boolean(globalObj.__REMOTEDEV__ || globalObj.nativeCallSyncHook);
}

export async function isDebuggerAttached(): Promise<boolean> {
  if (__DEV__) return false;

  if (hasRemoteDevHook()) return true;

  if (Platform.OS === 'android' && nativeModule?.isDebuggerConnected) {
    try {
      return await nativeModule.isDebuggerConnected();
    } catch {
      return false;
    }
  }

  return false;
}

export async function runAntiDebugCheck(): Promise<void> {
  const attached = await isDebuggerAttached();
  if (attached && !__DEV__) {
    console.warn('[security] Debugger detected');
  }
}
