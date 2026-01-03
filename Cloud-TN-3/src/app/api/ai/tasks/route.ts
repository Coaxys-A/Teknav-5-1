import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { id: "task-001", type: "content-analyze", status: "done", agent: "agent-content", output: { tldr: "خلاصه آماده" } },
      { id: "task-002", type: "scenario-generate", status: "running", agent: "agent-scenario", output: null },
    ],
  });
}
