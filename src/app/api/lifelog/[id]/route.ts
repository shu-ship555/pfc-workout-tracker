import { NextResponse } from "next/server";
import { updateLifeLogMood } from "@/lib/notion";
import { DEMO_LIFE_LOGS } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { moodSelect } = await req.json();
  if (IS_DEMO) {
    const entry = DEMO_LIFE_LOGS.find((l) => l.id === id);
    if (entry) {
      entry.moodSelect = moodSelect;
      entry.mood = Number(moodSelect);
    }
    return NextResponse.json({ ok: true });
  }
  await updateLifeLogMood(id, moodSelect);
  return NextResponse.json({ ok: true });
}
