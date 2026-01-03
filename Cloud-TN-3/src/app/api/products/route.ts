import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET() {
  try {
    const products = await callBackend({ path: "/products", method: "GET", cache: "no-store" });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
