import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slotKey = searchParams.get("slotKey");
  const device = searchParams.get("device") ?? "web";
  const lang = searchParams.get("lang") ?? "fa";
  const tags = searchParams.get("tags") ?? "";
  if (!slotKey) return NextResponse.json({ ok: false, error: "MISSING_SLOT" }, { status: 400 });
  try {
    const res = await callBackend<{ creative: any }>({
      path: `/ads/serve`,
      method: "GET",
      cache: "no-store",
      searchParams: new URLSearchParams({ slotKey, device, lang, tags }),
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
