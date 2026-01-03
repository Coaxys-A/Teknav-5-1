import { NextResponse } from "next/server";

const SUBMIT_SECRET = process.env.SUBMIT_SECRET || "";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    if ((form.get("hp") as string)?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const payload = {
      title: (form.get("title") || "").toString().slice(0, 200),
      category: (form.get("category") || "").toString().slice(0, 60),
      image: (form.get("image") || "").toString().slice(0, 1000),
      excerpt: (form.get("excerpt") || "").toString().slice(0, 1000),
      content: (form.get("content") || "").toString().slice(0, 20000),
      auth: (form.get("auth") || "").toString(),
    };

    if (SUBMIT_SECRET && payload.auth !== SUBMIT_SECRET) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    console.log("SUBMISSION:", { ...payload, contentLen: payload.content.length });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SUBMIT_ERROR", error);
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
