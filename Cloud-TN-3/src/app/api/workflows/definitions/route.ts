import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { id: "wf-001", name: "انتشار + SEO", trigger: "publish", status: "active" },
      { id: "wf-002", name: "هشدار امنیتی WAF", trigger: "security", status: "active" },
      { id: "wf-003", name: "سینک پلاگین با AI", trigger: "schedule", status: "experimental" },
    ],
  });
}
