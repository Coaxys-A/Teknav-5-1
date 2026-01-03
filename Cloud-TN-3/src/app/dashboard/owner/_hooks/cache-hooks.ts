'use client';

import useSWR, { mutate } from "swr";
import { useCallback, useEffect, useMemo, useOptimistic, useTransition } from "react";
import { z } from "zod";

type Fetcher<T> = (params: { page: number; sort?: string; search?: string }) => Promise<T>;

export function useOwnerTableData<T extends { rows: any[]; total: number; page: number; pageSize: number }>(
  key: string,
  fetcher: Fetcher<T>,
) {
  const { data, error, isLoading } = useSWR(key, () => fetcher({ page: 1 }), { revalidateOnFocus: false });
  const [state, setState] = useOptimistic<T | undefined>(data);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(
    (params: Partial<{ page: number; sort?: string; search?: string }>) => {
      startTransition(async () => {
        const res = await fetcher({
          page: params.page ?? state?.page ?? 1,
          sort: params.sort ?? undefined,
          search: params.search ?? undefined,
        });
        setState(res);
        mutate(key, res, false);
      });
    },
    [fetcher, key, setState, state],
  );

  return {
    data: state ?? data,
    error,
    loading: isLoading || isPending,
    refresh,
  };
}

export function useOwnerForm<T>(schema: z.ZodType<T>, action: (data: T) => Promise<{ ok: boolean; error?: string }>) {
  const [isPending, startTransition] = useTransition();
  const submit = useCallback(
    async (data: T) => {
      const parsed = schema.parse(data);
      return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        startTransition(async () => {
          try {
            const res = await action(parsed);
            resolve(res);
          } catch (err: any) {
            resolve({ ok: false, error: err?.message ?? "error" });
          }
        });
      });
    },
    [action, schema],
  );
  return { submit, isPending };
}

export function useRedisCache<T>(key: string, fetcher: () => Promise<T>) {
  const { data, error, isLoading, mutate: swrMutate } = useSWR(key, fetcher, { revalidateOnFocus: false });
  const invalidate = useCallback(() => swrMutate(), [swrMutate]);
  return { data, error, loading: isLoading, invalidate };
}

export function useInvalidateCache() {
  return useCallback((keys: string[]) => keys.forEach((k) => mutate(k)), []);
}

export function useAnalyticsLive(fetcher: () => Promise<any>, intervalMs = 5000) {
  const { data, mutate: swrMutate } = useSWR("analytics-live", fetcher, { refreshInterval: intervalMs });
  return { data, refresh: swrMutate };
}

export function usePubSubEvents(channel: string, onMessage: (data: any) => void) {
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001");
    ws.onopen = () => ws.send(JSON.stringify({ subscribe: channel }));
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.channel === channel) onMessage(payload.data);
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, [channel, onMessage]);
}

export function useOptimisticState<T>(initial: T) {
  const [state, setState] = useOptimistic(initial);
  const [isPending, startTransition] = useTransition();
  const update = useCallback((updater: (prev: T) => T) => startTransition(() => setState(updater)), [setState]);
  return { state, update, isPending };
}
