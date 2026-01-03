import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ db: "ok", queue: "ok", version: "v1.0.0" });
}
