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
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  try {
    await callBackend({
      path: `/tags/${id}`,
      method: "PUT",
      token: session.token,
      body: { name: body?.name },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
