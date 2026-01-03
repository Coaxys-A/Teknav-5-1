import { NextResponse } from "next/server";

const TOOLS = [
  { id: "content-analyze", name: "تحلیل محتوا", kind: "ai", input: "articleId|text", output: "summary,tags,seo" },
  { id: "scenario-generate", name: "تولید سناریوی قرمز", kind: "ai", input: "seed", output: "killchain,ttps,iocs" },
  { id: "recommend-next", name: "پیشنهاد بعدی", kind: "ai", input: "profileId", output: "articles" },
  { id: "plugin-call-logger", name: "اجرای پلاگین Logger", kind: "plugin", input: "payload", output: "status" },
];

export async function GET() {
  return NextResponse.json({ items: TOOLS });
}
