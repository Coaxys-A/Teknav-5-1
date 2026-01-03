import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";
import { rateLimit } from "@/lib/rateLimit";
import { callBackend } from "@/lib/backend";

interface CreateArticleResponse {
  id: number;
  title: string;
  slug: string;
  status: string;
  aiScore?: number;
}

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("WRITER", session.role);
  } catch (error) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(`articles:add:${ip}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "RATE_LIMIT" }, { status: 429 });
  }

  const body = await request.json();
  if (!validateCsrfToken(body?.csrfToken)) {
    return NextResponse.json({ ok: false, error: "INVALID_CSRF" }, { status: 400 });
  }

  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  if (!title || !content) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    const article = await callBackend<CreateArticleResponse>({
      path: "/articles",
      method: "POST",
      token: session.token,
      body: {
        title,
        content,
        excerpt: body?.excerpt ?? "",
        categorySlug: body?.categorySlug ?? null,
        categoryId: body?.categoryId ?? null,
        tags: body?.tags ?? [],
        tagIds: body?.tagIds ?? [],
        metaTitle: body?.metaTitle ?? null,
        metaDescription: body?.metaDescription ?? null,
        mainKeyword: body?.mainKeyword ?? null,
        coverImageId: body?.coverImageId ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      id: article.id,
      slug: article.slug,
      status: article.status,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
