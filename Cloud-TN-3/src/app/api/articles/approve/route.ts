import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

interface ApproveArticleResponse {
  id: number;
  status: string;
  aiScore?: number;
}

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("ADMIN", session.role);
  } catch (error) {
    try {
      assertRole("OWNER", session.role);
    } catch {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const body = await request.json();
  const id = Number(body?.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  try {
    const article = await callBackend<ApproveArticleResponse>({
      path: `/articles/${id}/approve`,
      method: "PATCH",
      token: session.token,
    });

    return NextResponse.json({ ok: true, status: article.status, aiScore: article.aiScore });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
