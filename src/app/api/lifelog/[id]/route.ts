import { NextResponse } from "next/server";
import { updateLifeLogMood, updateLifeLogConsumedKcal } from "@/lib/notion";
import { DEMO_LIFE_LOGS } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (IS_DEMO) {
    const entry = DEMO_LIFE_LOGS.find((l) => l.id === id);
    if (entry) {
      if (body.moodSelect !== undefined) {
        entry.moodSelect = body.moodSelect;
        entry.mood = Number(body.moodSelect);
      }
      if (body.consumedKcal !== undefined) {
        entry.consumedKcal = body.consumedKcal;
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body.moodSelect !== undefined) {
    await updateLifeLogMood(id, body.moodSelect);
  }
  if (body.consumedKcal !== undefined) {
    await updateLifeLogConsumedKcal(id, body.consumedKcal);
  }
  return NextResponse.json({ ok: true });
}
