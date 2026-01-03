import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionContext();
  assertRole("EDITOR", session.role);
  const translations = await callBackend<any[]>({
    path: `/translation/article/${id}/list`,
    method: "GET",
    token: session.token,
    cache: "no-store",
  });
  return NextResponse.json({ ok: true, translations });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionContext();
  try {
    assertRole("EDITOR", session.role);
  } catch {
    assertRole("ADMIN", session.role);
  }
  const body = await request.json();
  const translation = await callBackend({
    path: `/translation/article/${id}`,
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, translation });
}
