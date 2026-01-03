import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const enabled = new URL(req.url).searchParams.get("enabled") === "true";
  return NextResponse.json({ ok: true, key, enabled });
}
