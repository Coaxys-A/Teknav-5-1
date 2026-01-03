import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, assigned: key, user: body?.user ?? null });
}
