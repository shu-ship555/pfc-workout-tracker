import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDietGoal, setDietGoal } from "@/lib/notion";
import type { DietGoal } from "@/lib/types";
import { IS_DEMO } from "@/lib/api-utils";
import { DEMO_GOAL } from "@/lib/demo-data";

export async function GET() {
  if (IS_DEMO) return NextResponse.json(DEMO_GOAL);
  try {
    const goal = await getDietGoal();
    return NextResponse.json(goal);
  } catch {
    return NextResponse.json({ type: "lose", targetKg: 3, startDate: "", endDate: "" } satisfies DietGoal);
  }
}

export async function POST(req: Request) {
  if (IS_DEMO) return NextResponse.json(DEMO_GOAL);
  try {
    const goal = (await req.json()) as DietGoal;
    await setDietGoal(goal);
    revalidateTag("diet-goal", {});
    return NextResponse.json(goal);
  } catch (e) {
    console.error("[diet-goal POST]", e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
