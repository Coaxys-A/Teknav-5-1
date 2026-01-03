import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  try {
    const articles = await callBackend<any[]>({
      path: "/articles/public",
      method: "GET",
      searchParams: status ? new URLSearchParams({ status }) : undefined,
      cache: "no-store",
    });
    return NextResponse.json({ ok: true, articles });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
