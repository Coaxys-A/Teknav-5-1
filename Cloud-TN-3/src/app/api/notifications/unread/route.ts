import { NextResponse } from "next/server";

const NOTIFS = [
  { id: "n1", title: "۲ مقاله جدید منتشر شد", unread: true, createdAt: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ ok: true, items: NOTIFS });
}
