import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { key: "beta-new-editor", name: "فعال‌سازی ادیتور جدید", enabled: true, rollout: 0.65 },
      { key: "payments-v2", name: "درگاه پرداخت نسخه ۲", enabled: false, rollout: 0.2 },
    ],
  });
}
