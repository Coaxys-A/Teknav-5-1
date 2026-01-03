import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  try {
    const items = await callBackend<any[]>({
      path: `/recommendations/related/${id}`,
      method: "GET",
      cache: "no-store",
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
