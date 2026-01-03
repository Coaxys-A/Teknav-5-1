import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { getSessionContext } from "@/lib/auth";

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  const eventType = String(body?.eventType ?? "");
  const meta = body?.meta ?? {};
  if (!eventType) return NextResponse.json({ ok: false, error: "NO_EVENT" }, { status: 400 });
  try {
    await callBackend({
      path: "/events/track",
      method: "POST",
      body: { eventType, meta },
      token: session.token,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
