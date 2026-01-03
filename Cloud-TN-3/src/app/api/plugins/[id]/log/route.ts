import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, pluginId: id, logId: "log-" + Date.now(), payload: body });
}
