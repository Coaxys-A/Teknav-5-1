import { NextResponse } from "next/server";

const PLUGINS = [
  { id: "plugin-logger", name: "Logger", version: "1.0.0", status: "active", category: "امنیت" },
  { id: "plugin-content-ai", name: "تحلیل محتوا", version: "0.9.1", status: "active", category: "AI" },
];

export async function GET() {
  return NextResponse.json({ items: PLUGINS });
}
