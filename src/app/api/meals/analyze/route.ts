import { NextResponse } from "next/server";
import { analyzeText, analyzeImage, refineWithContext } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.supplement && body.prev) {
      const result = await refineWithContext(body.prev, body.supplement);
      return NextResponse.json(result);
    }

    if (body.image) {
      const result = await analyzeImage(
        body.image,
        body.mimeType ?? "image/jpeg"
      );
      return NextResponse.json(result);
    }

    if (body.text) {
      const result = await analyzeText(body.text);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
