import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET() {
  const session = getSessionContext();
  const consents = await callBackend<any[]>({ path: "/consent", method: "GET", token: session.token, cache: "no-store" });
  return NextResponse.json({ ok: true, consents });
}

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  const consents = await callBackend<any[]>({
    path: "/consent",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, consents });
}
