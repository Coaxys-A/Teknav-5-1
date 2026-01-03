import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("EDITOR", session.role);
  } catch {
    try {
      assertRole("ADMIN", session.role);
    } catch {
      try {
        assertRole("OWNER", session.role);
      } catch {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
    }
  }

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });

  try {
    const tag = await callBackend({
      path: "/tags",
      method: "POST",
      token: session.token,
      body: { name },
    });
    return NextResponse.json({ ok: true, tag });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
