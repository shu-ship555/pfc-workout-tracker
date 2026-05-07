import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { listWorkouts, listMeals, getDietGoal } from "@/lib/notion";
import { jstToday, jstMonthsAgo } from "@/lib/date-utils";
import { IS_DEMO } from "@/lib/api-utils";
import { getShiftedDemoWorkouts, getShiftedDemoMeals } from "@/lib/demo-data";
import type { DietGoal } from "@/lib/types";

const DEMO_GOAL: DietGoal = { type: "lose", targetKg: 3, startDate: "2026-04-01", endDate: "2026-06-30" };

const getCachedInit = unstable_cache(
  async (since: string) => {
    const [workouts, meals, dietGoal] = await Promise.all([
      listWorkouts(since || undefined),
      listMeals(since || undefined),
      getDietGoal(),
    ]);
    return { workouts, meals, dietGoal };
  },
  ["init"],
  { revalidate: 60, tags: ["workouts", "meals", "diet-goal"] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam === null ? jstMonthsAgo(3) : (sinceParam || "");

  if (IS_DEMO) {
    const today = jstToday();
    return NextResponse.json({
      workouts: getShiftedDemoWorkouts(today),
      meals: getShiftedDemoMeals(today),
      dietGoal: DEMO_GOAL,
    });
  }

  const data = await getCachedInit(since);
  return NextResponse.json(data);
}
