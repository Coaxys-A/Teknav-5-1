import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { id: "prd-001", name: "اشتراک پریمیوم", price: 99000, currency: "IRR", status: "active" },
      { id: "prd-002", name: "گزارش فنی", price: 49000, currency: "IRR", status: "beta" },
    ],
  });
}
