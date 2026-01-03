import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") ?? undefined;
  const items = await callBackend<any[]>({
    path: `/topics${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
    method: "GET",
    cache: "no-store",
  });
  return NextResponse.json({ ok: true, topics: items });
}
