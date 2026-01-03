import { NextResponse } from "next/server";
import { getSessionContext, assertRole } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("WRITER", session.role);
  } catch (error) {
    try {
      assertRole("EDITOR", session.role);
    } catch {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const body = await request.json();
  const content = String(body?.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ ok: false, error: "MISSING_CONTENT" }, { status: 400 });
  }

  try {
    const data = await callBackend<{
      title: string;
      metaDescription: string;
      keywords: string[];
      slug: string;
    }>({
      path: "/ai/suggest-metadata",
      method: "POST",
      token: session.token,
      body: { content },
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
