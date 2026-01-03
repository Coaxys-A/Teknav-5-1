import { NextResponse } from "next/server";

const NOTIFS = [
  { id: "n1", title: "۲ مقاله جدید منتشر شد", unread: true, createdAt: new Date().toISOString() },
  { id: "n2", title: "به‌روزرسانی پرچم پرداخت", unread: false, createdAt: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ ok: true, items: NOTIFS });
}
