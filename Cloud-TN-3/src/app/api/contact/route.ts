import { NextResponse } from "next/server";

function isFlood() {
  return false;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    if ((form.get("hp") as string)?.trim()) {
      return NextResponse.json({ ok: true });
    }

    if (isFlood()) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const payload = {
      name: (form.get("name") || "").toString().slice(0, 120),
      email: (form.get("email") || "").toString().slice(0, 160),
      subject: (form.get("subject") || "").toString().slice(0, 160),
      message: (form.get("message") || "").toString().slice(0, 4000),
    };

    console.log("CONTACT:", payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CONTACT_ERROR", error);
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
