import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    aggregates: {
      views30d: 125000,
      uniqueUsers: 48210,
      avgReadTime: 232,
      scrollDepthAvg: 0.68,
    },
  });
}
