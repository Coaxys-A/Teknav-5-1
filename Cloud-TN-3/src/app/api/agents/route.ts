import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET() {
  const session = getSessionContext();
  assertRole("ADMIN", session.role);
  const agents = await callBackend<any[]>({ path: "/agents", method: "GET", token: session.token, cache: "no-store" });
  return NextResponse.json({ ok: true, agents });
}

export async function POST(request: Request) {
  const session = getSessionContext();
  assertRole("ADMIN", session.role);
  const body = await request.json();
  const res = await callBackend<{ ok: boolean; summary?: any; error?: string }>({
    path: "/agents/run",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json(res);
}
