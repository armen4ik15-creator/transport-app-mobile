import { api, setBlockedHandler } from '../api/client';
import { getStoredActivationToken, getStoredDeviceId } from '../utils/cryptoBundle';
import { hashActivationToken } from '../utils/hmacSign';

const HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000;
const MAX_FAILURES = 3;

let intervalId: ReturnType<typeof setInterval> | null = null;
let failureCount = 0;
let blockCallback: ((reason: string) => void) | null = null;

interface HeartbeatResponse {
  ok?: boolean;
  blocked?: boolean;
  reason?: string;
  error?: string;
}

export function setHeartbeatBlockCallback(handler: ((reason: string) => void) | null): void {
  blockCallback = handler;
}

function triggerBlock(reason: string): void {
  stopHeartbeat();
  blockCallback?.(reason);
}

async function sendHeartbeat(): Promise<void> {
  const deviceId = await getStoredDeviceId();
  const activationToken = await getStoredActivationToken();
  if (!deviceId || !activationToken) return;

  const codeHash = hashActivationToken(activationToken);

  try {
    const { data } = await api.post<HeartbeatResponse>('/heartbeat', {
      device_id: deviceId,
      activation_token: activationToken,
      code_hash: codeHash,
    });

    if (data.blocked) {
      triggerBlock(data.reason ?? data.error ?? 'Доступ заблокирован');
      return;
    }

    failureCount = 0;
  } catch (err: unknown) {
    const response = (err as { response?: { status?: number; data?: HeartbeatResponse } }).response;
    if (response?.status === 404 || response?.status === 501) {
      return;
    }
    if (response?.status === 403 && response.data?.blocked) {
      triggerBlock(response.data.reason ?? response.data.error ?? 'Доступ заблокирован');
      return;
    }

    failureCount += 1;
    if (failureCount >= MAX_FAILURES) {
      triggerBlock('Не удалось связаться с сервером безопасности');
    }
  }
}

export function startHeartbeat(): void {
  if (intervalId) return;

  void sendHeartbeat();
  intervalId = setInterval(() => {
    void sendHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  failureCount = 0;
}

export function initHeartbeatBlockedBridge(onBlocked: (reason: string) => void): void {
  setHeartbeatBlockCallback(onBlocked);
  setBlockedHandler((reason) => {
    triggerBlock(reason);
  });
}
