import { NextResponse } from "next/server";
import { validateCsrfToken } from "@/lib/csrf";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.json();
  if (!validateCsrfToken(body?.csrfToken)) {
    return NextResponse.json({ ok: false, error: "INVALID_CSRF" }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }
  try {
    await callBackend<{ success: boolean }>({
      path: "/auth/request-otp",
      method: "POST",
      body: { email },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
