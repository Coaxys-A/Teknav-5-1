import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o-mini", provider: "openai", context: 128000, price: "standard", status: "active" },
      { id: "openai/gpt-oss-120b:free", name: "OpenAI GPT-OSS-120B (Free)", provider: "openai", context: 32768, price: "free", status: "active" },
    ],
  });
}
