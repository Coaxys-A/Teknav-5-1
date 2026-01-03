import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teknav_token")?.value;
  const sessionId = cookieStore.get("teknav_sid")?.value;
  if (!token || !sessionId) {
    cookieStore.delete("teknav_token");
    cookieStore.delete("teknav_refresh");
    cookieStore.delete("teknav_sid");
    return NextResponse.json({ ok: true });
  }

  try {
    await callBackend({
      path: "/auth/logout",
      method: "POST",
      token,
      body: { sessionId },
    });
  } catch {
    // در صورت خطا هم کوکی‌ها پاک می‌شوند
  }

  cookieStore.delete("teknav_token");
  cookieStore.delete("teknav_refresh");
  cookieStore.delete("teknav_sid");
  return NextResponse.json({ ok: true });
}
