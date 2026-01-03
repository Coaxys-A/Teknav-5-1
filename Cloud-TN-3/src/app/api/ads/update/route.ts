import { NextResponse } from "next/server";
import { assertRole, getSessionContext } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";
import { AdSlotConfig, writeAds } from "@/lib/ads";

function sanitizePayload(items: unknown): AdSlotConfig[] {
  if (!Array.isArray(items)) {
    return [];
  }
  const sanitized: AdSlotConfig[] = [];
  for (const item of items) {
    if (typeof item?.position === "string" && typeof item?.creativeUrl === "string") {
      sanitized.push({
        position: item.position,
        creativeUrl: item.creativeUrl,
        alt: typeof item?.alt === "string" ? item.alt : undefined,
        weight: typeof item?.weight === "number" ? item.weight : 1,
        linkUrl: typeof item?.linkUrl === "string" ? item.linkUrl : undefined,
        active: typeof item?.active === "boolean" ? item.active : true,
      });
    }
  }
  return sanitized;
}

export async function POST(request: Request) {
  const session = getSessionContext();
  try {
    assertRole("OWNER", session.role);
  } catch (error) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  if (!validateCsrfToken(body?.csrfToken)) {
    return NextResponse.json({ ok: false, error: "INVALID_CSRF" }, { status: 400 });
  }

  const items = sanitizePayload(body?.items);
  await writeAds(items);
  return NextResponse.json({ ok: true });
}
