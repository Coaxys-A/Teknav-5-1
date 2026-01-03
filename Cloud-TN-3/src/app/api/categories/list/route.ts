import { NextResponse } from "next/server";
import { getSessionContext, assertRole } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET() {
  const session = getSessionContext();
  try {
    assertRole("WRITER", session.role);
  } catch {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const categories = await callBackend<any[]>({
      path: "/categories",
      method: "GET",
      token: session.token,
      cache: "no-store",
    });
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
