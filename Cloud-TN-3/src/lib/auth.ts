import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { normalizeRole, type UserRole } from "./roles";

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

export interface SessionContext {
  userId?: string;
  email?: string;
  role: UserRole;
  token?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }
  const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const base64 = normalized + "=".repeat(padLength);
  if (typeof atob === "undefined") {
    return null;
  }
  const decoded = atob(base64);
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function readServerToken(req?: NextRequest): string | undefined {
  if (req) {
    const token = req.cookies.get("teknav_token")?.value;
    if (token) {
      return token;
    }
    return req.headers.get("x-teknav-token") ?? undefined;
  }
  return undefined;
}

export function getSessionContext(req?: NextRequest): SessionContext {
  const token = readServerToken(req);
  if (!token) {
    return { role: "GUEST" };
  }
  const payload = decodeJwt(token);
  if (!payload) {
    return { role: "GUEST" };
  }
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { role: "GUEST" };
  }
  return {
    userId: typeof payload.sub === "string" ? payload.sub : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    role: normalizeRole(typeof payload.role === "string" ? payload.role : undefined),
    token,
  };
}

export function assertRole(required: UserRole, actual: UserRole | undefined): void {
  const normalized = normalizeRole(actual);
  const priorities: Record<UserRole, number> = {
    OWNER: 9,
    ADMIN: 8,
    MANAGER: 7,
    EDITOR: 6,
    AUTHOR: 5,
    WRITER: 4,
    CREATOR: 3,
    PUBLISHER: 3,
    USER: 2,
    GUEST: 1,
  };
  if (priorities[normalized] < priorities[required]) {
    const err = new Error("Forbidden");
    (err as any).statusCode = 403;
    throw err;
  }
}
