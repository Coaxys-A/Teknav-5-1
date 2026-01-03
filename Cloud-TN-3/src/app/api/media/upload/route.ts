import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("WRITER", session.role);
  } catch {
    try {
      assertRole("EDITOR", session.role);
    } catch {
      try {
        assertRole("ADMIN", session.role);
      } catch {
        try {
          assertRole("OWNER", session.role);
        } catch {
          return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
        }
      }
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
  const upstream = await fetch(`${backendUrl}/media/upload`, {
    method: "POST",
    headers: {
      Authorization: session.token ? `Bearer ${session.token}` : "",
    },
    body: formData as any,
  });

  const json = await upstream.json();
  if (!upstream.ok || json.ok === false) {
    return NextResponse.json({ ok: false, error: json.error ?? "UPLOAD_FAILED" }, { status: upstream.status });
  }
  return NextResponse.json(json);
}
