import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { getSessionContext } from "@/lib/auth";

export async function GET() {
  const session = getSessionContext();
  const items = await callBackend<any[]>({ path: "/workspaces", method: "GET", token: session.token, cache: "no-store" });
  return NextResponse.json({ ok: true, workspaces: items });
}

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  const ws = await callBackend({
    path: "/workspaces",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, workspace: ws });
}
