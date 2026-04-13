import { NextResponse } from "next/server";
import { updateLifeLogMood } from "@/lib/notion";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (IS_DEMO) return NextResponse.json({ ok: true });
  const { id } = await params;
  const { moodSelect } = await req.json();
  await updateLifeLogMood(id, moodSelect);
  return NextResponse.json({ ok: true });
}
