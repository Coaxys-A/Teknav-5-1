import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: [
      { id: "wf-inst-001", definitionId: "wf-001", status: "completed", startedAt: "2025-12-05T08:00:00Z" },
      { id: "wf-inst-002", definitionId: "wf-002", status: "running", startedAt: "2025-12-05T09:30:00Z" },
    ],
  });
}
