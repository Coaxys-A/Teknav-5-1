const redisUrl = process.env.NEXT_PUBLIC_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.NEXT_PUBLIC_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function callUpstash(body: any) {
  if (!redisUrl || !redisToken) return null;
  const res = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function redisGet(key: string) {
  const json = await callUpstash([["GET", key]]);
  return json?.[0]?.result ?? null;
}

export async function redisSet(key: string, value: any, ttlSeconds?: number) {
  const payload = ttlSeconds ? [["SET", key, JSON.stringify(value), "EX", ttlSeconds]] : [["SET", key, JSON.stringify(value)]];
  await callUpstash(payload);
}

export async function redisIncr(key: string, ttlSeconds?: number) {
  const ops: any[] = [["INCR", key]];
  if (ttlSeconds) ops.push(["EXPIRE", key, ttlSeconds]);
  const json = await callUpstash(ops);
  return json?.[0]?.result ?? 0;
}

export async function redisDel(key: string) {
  await callUpstash([["DEL", key]]);
}
