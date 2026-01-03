import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function GET(request: Request) {
  const session = getSessionContext();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const items = await callBackend<any[]>({
    path: `/ai-templates${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
    method: "GET",
    token: session.token,
    cache: "no-store",
  });
  return NextResponse.json({ ok: true, templates: items });
}

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  const tpl = await callBackend({
    path: "/ai-templates",
    method: "POST",
    token: session.token,
    body,
  });
  return NextResponse.json({ ok: true, template: tpl });
}
