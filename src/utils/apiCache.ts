interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_STALE_MS = 5 * 60_000;

function readEntry<T>(key: string, allowStale: boolean): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now <= entry.expiresAt) return entry.value as T;
  if (allowStale && now <= entry.staleUntil) return entry.value as T;
  store.delete(key);
  return null;
}

export function getCached<T>(key: string): T | null {
  return readEntry<T>(key, false);
}

export function getStaleCached<T>(key: string): T | null {
  return readEntry<T>(key, true);
}

export function setCached<T>(key: string, value: T, ttlMs: number, staleMs = DEFAULT_STALE_MS): void {
  const now = Date.now();
  store.set(key, {
    value,
    expiresAt: now + ttlMs,
    staleUntil: now + ttlMs + staleMs,
  });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export async function fetchCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached != null) return cached;
  const value = await loader();
  setCached(key, value, ttlMs);
  return value;
}

export async function fetchCachedResilient<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  staleMs = DEFAULT_STALE_MS
): Promise<T> {
  const fresh = getCached<T>(key);
  if (fresh != null) return fresh;

  try {
    const value = await loader();
    setCached(key, value, ttlMs, staleMs);
    return value;
  } catch (error) {
    const stale = getStaleCached<T>(key);
    if (stale != null) return stale;
    throw error;
  }
}
