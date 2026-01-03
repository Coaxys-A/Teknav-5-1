import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const locale = searchParams.get("locale") ?? undefined;
  const tags = searchParams.get("tags") ?? undefined;
  const page = searchParams.get("page") ?? undefined;
  const limit = searchParams.get("limit") ?? undefined;
  const items = await callBackend<any>({
    path: "/search",
    method: "GET",
    searchParams: new URLSearchParams({
      ...(q ? { q } : {}),
      ...(locale ? { locale } : {}),
      ...(tags ? { tags } : {}),
      ...(page ? { page } : {}),
      ...(limit ? { limit } : {}),
    }),
    cache: "no-store",
  });
  return NextResponse.json({ ok: true, ...items });
}
