import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET() {
  const session = getSessionContext();
  try {
    assertRole("ADMIN", session.role);
  } catch {
    assertRole("OWNER", session.role);
  }
  const locales = await callBackend<any[]>({ path: "/translation/locales", method: "GET", token: session.token, cache: "no-store" });
  return NextResponse.json({ ok: true, locales });
}

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("ADMIN", session.role);
  } catch {
    assertRole("OWNER", session.role);
  }
  const body = await request.json();
  const locale = await callBackend({
    path: "/translation/locales",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, locale });
}
