import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionContext();
  const body = await request.json();
  const res = await callBackend({
    path: `/ai-templates/${id}/run`,
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, result: res });
}
