import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis-rest";

export async function GET() {
  const cacheKey = "teknav:analytics:summary";
  const cached = await redisGet(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return NextResponse.json(parsed);
    } catch {}
  }
  const payload = {
    summary: {
      traffic: 8420,
      engagement: 0.68,
      avgTime: "3:45",
      topRefs: ["Organic", "Direct", "Social"],
    },
    charts: {
      views7d: [1200, 1320, 1410, 1600, 1580, 1700, 1810],
      countries: [
        { name: "IR", value: 62 },
        { name: "DE", value: 12 },
        { name: "US", value: 10 },
        { name: "AE", value: 8 },
      ],
    },
  };
  await redisSet(cacheKey, payload, 300);
  return NextResponse.json(payload);
}
