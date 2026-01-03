import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.agent || !body.tool) {
    return NextResponse.json({ ok: false, error: "agent و tool لازم است" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, runId: "run-" + Date.now(), agent: body.agent, tool: body.tool, input: body.input ?? null });
}
