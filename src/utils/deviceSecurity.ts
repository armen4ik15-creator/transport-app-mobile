let deviceSecurityReady = false;
let registrationPromise: Promise<boolean> | null = null;

export function isDeviceSecurityReady(): boolean {
  return deviceSecurityReady;
}

export function markDeviceSecurityReady(ready: boolean): void {
  deviceSecurityReady = ready;
}

export function resetDeviceSecurityReady(): void {
  deviceSecurityReady = false;
  registrationPromise = null;
}

export function runDeviceRegistrationOnce(task: () => Promise<boolean>): Promise<boolean> {
  if (deviceSecurityReady) {
    return Promise.resolve(true);
  }
  if (!registrationPromise) {
    registrationPromise = task()
      .then((ok) => {
        deviceSecurityReady = ok;
        return ok;
      })
      .catch(() => {
        deviceSecurityReady = false;
        return false;
      })
      .finally(() => {
        registrationPromise = null;
      });
  }
  return registrationPromise;
}
