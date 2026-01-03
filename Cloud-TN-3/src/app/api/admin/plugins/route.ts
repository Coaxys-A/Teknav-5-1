import { NextResponse } from "next/server";

const SAMPLE_PLUGINS = [
  { key: "plugin-logger", name: "Logger", slot: "dashboard_right", type: "widget", description: "ثبت رویدادها", isEnabled: true },
  { key: "plugin-content-ai", name: "تحلیل محتوا", slot: "article_sidebar", type: "widget", description: "برچسب‌گذاری و SEO", isEnabled: true },
];

export async function GET() {
  return NextResponse.json({ ok: true, plugins: SAMPLE_PLUGINS });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.key || !body?.name) {
    return NextResponse.json({ ok: false, error: "کلید و نام الزامی است" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, plugin: { ...body, isEnabled: body.isEnabled ?? true } });
}
