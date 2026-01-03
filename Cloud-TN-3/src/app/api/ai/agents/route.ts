import { NextResponse } from "next/server";

const AGENTS = [
  { id: "agent-content", name: "تحلیل محتوا", kind: "content", enabled: true, tools: ["content-analyze", "recommend-next"] },
  { id: "agent-scenario", name: "سناریوی قرمز", kind: "scenario", enabled: true, tools: ["scenario-generate"] },
  { id: "agent-personalization", name: "شخصی‌سازی", kind: "personalization", enabled: true, tools: ["recommend-next"] },
  { id: "agent-plugin-bridge", name: "پل AI به پلاگین", kind: "plugin", enabled: true, tools: ["plugin-call-logger"] },
];

export async function GET() {
  return NextResponse.json({ items: AGENTS });
}
