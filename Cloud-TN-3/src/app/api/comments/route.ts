import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { callBackend } from "@/lib/backend";

export async function POST(request: Request) {
  const session = getSessionContext();
  const body = await request.json();
  try {
    const res = await callBackend({
      path: "/comments",
      method: "POST",
      token: session.token,
      body,
    });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
