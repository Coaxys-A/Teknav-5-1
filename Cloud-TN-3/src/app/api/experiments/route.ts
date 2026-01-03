import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { key: "homepage-layout", name: "چیدمان صفحه اصلی", status: "running", variants: ["A", "B"] },
      { key: "ai-tweaks", name: "تنظیمات پاسخ AI", status: "paused", variants: ["control", "v1"] },
    ],
  });
}
