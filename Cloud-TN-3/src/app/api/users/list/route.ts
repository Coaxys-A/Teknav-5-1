import { NextResponse } from "next/server";

const USERS = [
  { email: "owner@example.com", role: "OWNER", status: "active" },
  { email: "admin@example.com", role: "ADMIN", status: "active" },
  { email: "writer@example.com", role: "WRITER", status: "pending" },
];

export async function GET() {
  return NextResponse.json({ items: USERS });
}
