import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis-rest";

export async function GET() {
  const cacheKey = "teknav:articles:list";
  const cached = await redisGet(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return NextResponse.json({ items: parsed, cached: true });
    } catch {
      // ignore parse
    }
  }
  const items = [
    { id: "art-001", title: "موج جدید ARM", status: "PUBLISHED", updatedAt: "1404-09-15" },
    { id: "art-002", title: "باج‌افزار چندمرحله‌ای", status: "PUBLISHED", updatedAt: "1404-09-15" },
    { id: "art-003", title: "اینترنت غیرمتمرکز", status: "PUBLISHED", updatedAt: "1404-09-15" },
  ];
  await redisSet(cacheKey, items, 300);
  return NextResponse.json({ items, cached: false });
}
