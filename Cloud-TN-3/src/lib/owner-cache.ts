import "server-only";
import { redisGet, redisSet } from "./redis-rest";

type CacheOptions<T> = {
  key: string;
  ttlSeconds?: number;
  fetcher: () => Promise<T>;
};

export async function getCached<T>({ key, ttlSeconds = 60, fetcher }: CacheOptions<T>): Promise<T> {
  try {
    const cached = await redisGet(key);
    if (cached) return JSON.parse(cached as string) as T;
  } catch {
    // ignore redis failure
  }
  const value = await fetcher();
  try {
    await redisSet(key, value, ttlSeconds);
  } catch {
    // ignore redis failure
  }
  return value;
}

export async function getCachedWithLock<T>({ key, ttlSeconds = 60, fetcher }: CacheOptions<T>): Promise<T> {
  const lockKey = `${key}:lock`;
  try {
    const cached = await redisGet(key);
    if (cached) return JSON.parse(cached as string) as T;
  } catch {
    // ignore
  }
  const lock = await redisGet(lockKey);
  if (lock) {
    await new Promise((r) => setTimeout(r, 50));
    return getCached({ key, ttlSeconds, fetcher });
  }
  try {
    await redisSet(lockKey, "1", 5);
  } catch {
    // ignore
  }
  const value = await fetcher();
  try {
    await redisSet(key, value, ttlSeconds);
  } catch {
    // ignore
  }
  return value;
}

export function cacheKey(namespace: string, parts: (string | number | undefined)[]) {
  return [namespace, ...parts.filter(Boolean)].join(":");
}

export async function cacheFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>) {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}
