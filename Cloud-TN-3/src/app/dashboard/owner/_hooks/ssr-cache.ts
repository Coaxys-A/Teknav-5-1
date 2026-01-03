import "server-only";
import { cache } from "react";
import { getCached, getCachedWithLock, cacheKey } from "@/lib/owner-cache";

export const ssrCached = cache(async <T>(namespace: string, args: (string | number | undefined)[], fetcher: () => Promise<T>) => {
  const key = cacheKey(namespace, args);
  return getCached({ key, fetcher, ttlSeconds: 60 });
});

export const ssrCachedLock = cache(async <T>(namespace: string, args: (string | number | undefined)[], fetcher: () => Promise<T>) => {
  const key = cacheKey(namespace, args);
  return getCachedWithLock({ key, fetcher, ttlSeconds: 60 });
});
