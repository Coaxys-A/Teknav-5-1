import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const session = getSessionContext();
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "10";
  if (!session.token) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const items = await callBackend<any[]>({
      path: `/recommendations/feed`,
      method: "GET",
      token: session.token,
      cache: "no-store",
      searchParams: new URLSearchParams({ limit }),
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
