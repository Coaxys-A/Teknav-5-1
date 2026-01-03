import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const session = getSessionContext();
  if (!session.token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await request.json();
  const content = String(body?.content ?? "");
  if (!content) return NextResponse.json({ error: "NO_CONTENT" }, { status: 400 });
  try {
    const res = await callBackend({
      path: "/ai/rewrite",
      method: "POST",
      token: session.token,
      body: { content },
    });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
