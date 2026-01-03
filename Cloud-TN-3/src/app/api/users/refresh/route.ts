import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

interface BackendRefreshResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshExpiresAt?: string;
  user: {
    id: number;
    email: string;
    role: string;
    name?: string;
  };
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("teknav_refresh")?.value;
  const sessionId = cookieStore.get("teknav_sid")?.value;
  if (!refreshToken || !sessionId) {
    return NextResponse.json({ ok: false, error: "NO_REFRESH" }, { status: 401 });
  }

  try {
    const data = await callBackend<BackendRefreshResponse>({
      path: "/auth/refresh",
      method: "POST",
      body: { sessionId, refreshToken },
    });

    const response = NextResponse.json({ ok: true });
    cookieStore.set("teknav_token", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    cookieStore.set("teknav_refresh", data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api",
    });
    cookieStore.set("teknav_sid", data.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api",
    });
    return response;
  } catch (error) {
    cookieStore.delete("teknav_token");
    cookieStore.delete("teknav_refresh");
    cookieStore.delete("teknav_sid");
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 401 });
  }
}
