const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

interface Entry {
  count: number;
  expires: number;
}

const store = new Map<string, Entry>();

export function rateLimit(key: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && entry.expires > now) {
    if (entry.count >= limit) {
      return false;
    }
    entry.count += 1;
    return true;
  }
  store.set(key, { count: 1, expires: now + windowMs });
  return true;
}

export function remainingRequests(key: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): number {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.expires <= now) {
    return limit - 1;
  }
  return Math.max(limit - entry.count, 0);
}
