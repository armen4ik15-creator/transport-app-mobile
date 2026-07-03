type HmacRecoveryListener = (active: boolean) => void;

let listener: HmacRecoveryListener | null = null;

export function setHmacRecoveryListener(next: HmacRecoveryListener | null): void {
  listener = next;
}

export function notifyHmacRecovery(active: boolean): void {
  listener?.(active);
}
