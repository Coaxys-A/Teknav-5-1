import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  const res = await callBackend({
    path: "/user-events/log",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, event: res });
}
