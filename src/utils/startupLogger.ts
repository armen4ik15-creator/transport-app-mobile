/** Console-only startup trace (no native modules at import time). */
export async function logStartup(step: string, detail?: string): Promise<void> {
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[startup] ${step}${suffix}`);
}

export function getStartupLogPath(): string {
  return '(console only — see adb logcat ReactNativeJS)';
}
