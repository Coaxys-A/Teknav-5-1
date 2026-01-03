import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionContext();
  try {
    assertRole("WRITER", session.role);
  } catch {
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
  }
  const numericId = Number(id);
  if (!numericId) return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  try {
    const versions = await callBackend<any[]>({
      path: `/articles/${numericId}/versions`,
      method: "GET",
      token: session.token,
      cache: "no-store",
    });
    return NextResponse.json({ ok: true, versions });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
