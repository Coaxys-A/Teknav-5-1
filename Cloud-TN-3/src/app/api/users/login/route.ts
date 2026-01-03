import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateCsrfToken } from "@/lib/csrf";
import { normalizeRole } from "@/lib/roles";
import { callBackend } from "@/lib/backend";
import { redisIncr, redisSet } from "@/lib/redis-rest";

interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshExpiresAt?: string;
  user: { id: number; email: string; role: string; name?: string };
}

const BLOCK_WINDOW = 300;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const body = await request.json();
  if (!validateCsrfToken(body?.csrfToken)) {
    return NextResponse.json({ ok: false, error: "INVALID_CSRF" }, { status: 400 });
  }

  const email = String(body?.username ?? body?.email ?? "").trim();
  const password = String(body?.password ?? "").trim();
  const deviceId = String(body?.deviceId ?? body?.device ?? "").trim() || "dev-device";
  const otpCode = body?.otpCode ? String(body?.otpCode).trim() : undefined;
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 400 });
  }

  const key = `teknav:login:${email}`;
  const attempts = await redisIncr(key, BLOCK_WINDOW);
  if (attempts && attempts > MAX_ATTEMPTS) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  // Offline/local owner shortcut (no DB needed)
  const fallbackEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "arsam12sb@gmail.com";
  const fallbackPass = process.env.NEXT_PUBLIC_OWNER_PASS ?? "FaR1619*";
  if (email === fallbackEmail && password === fallbackPass) {
    const response = NextResponse.json({ ok: true, role: "owner", userId: 1, fallback: true });
    response.cookies.set("teknav_token", "dev-token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    response.cookies.set("teknav_refresh", "dev-refresh", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api" });
    response.cookies.set("teknav_sid", "dev-session", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api" });
    await redisSet(key, 0, BLOCK_WINDOW);
    return response;
  }

  try {
    const data = await callBackend<BackendLoginResponse>({ path: "/auth/login", method: "POST", body: { email, password, otpCode, deviceId } });
    const role = normalizeRole(data.user.role);
    const response = NextResponse.json({ ok: true, role, userId: data.user.id });
    response.cookies.set("teknav_token", data.accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    response.cookies.set("teknav_refresh", data.refreshToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api" });
    response.cookies.set("teknav_sid", data.sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api" });
    await redisSet(key, 0, BLOCK_WINDOW);
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: "LOGIN_FAILED" }, { status: 401 });
  }
}
