import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: [
      { id: "ord-001", product: "اشتراک پریمیوم", amount: 99000, status: "paid" },
      { id: "ord-002", product: "گزارش فنی", amount: 49000, status: "pending" },
    ],
  });
}
