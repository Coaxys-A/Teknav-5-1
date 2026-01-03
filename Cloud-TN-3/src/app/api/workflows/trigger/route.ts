import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, triggered: body?.id ?? null, runId: "run-" + Date.now() });
}
