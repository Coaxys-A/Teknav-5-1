import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const product = await callBackend({ path: `/products/${id}`, method: "GET", cache: "no-store" });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
