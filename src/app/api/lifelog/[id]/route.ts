import { NextResponse } from "next/server";
import { updateLifeLogMood } from "@/lib/notion";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { moodSelect } = await req.json();
  await updateLifeLogMood(id, moodSelect);
  return NextResponse.json({ ok: true });
}
