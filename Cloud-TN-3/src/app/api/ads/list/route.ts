import { NextResponse } from "next/server";
import { readAds } from "@/lib/ads";

export async function GET() {
  const ads = await readAds();
  return NextResponse.json({ ok: true, ...ads });
}
