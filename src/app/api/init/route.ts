import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { listWorkouts, listMeals, getDietGoal } from "@/lib/notion";
import { jstToday, jstMonthsAgo, shiftDateStr } from "@/lib/date-utils";
import { IS_DEMO } from "@/lib/api-utils";
import { DEMO_WORKOUTS, DEMO_MEALS } from "@/lib/demo-data";
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

    const maxWorkoutDate = DEMO_WORKOUTS.reduce((max, w) => {
      const d = w.created.split("T")[0];
      return d > max ? d : max;
    }, "0000-00-00");
    const workoutShift = Math.round((Date.parse(today) - Date.parse(maxWorkoutDate)) / 86400000);
    const workouts = workoutShift === 0
      ? [...DEMO_WORKOUTS]
      : DEMO_WORKOUTS.map((w) => ({
          ...w,
          created: shiftDateStr(w.created, workoutShift) + w.created.slice(10),
        }));
    workouts.sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));

    const maxMealDate = DEMO_MEALS.reduce((max, m) => (m.date > max ? m.date : max), DEMO_MEALS[0].date);
    const mealShift = Math.round((Date.parse(today) - Date.parse(maxMealDate)) / 86400000);
    const meals = mealShift === 0 ? DEMO_MEALS : DEMO_MEALS.map((m) => ({ ...m, date: shiftDateStr(m.date, mealShift) }));

    return NextResponse.json({ workouts, meals, dietGoal: DEMO_GOAL });
  }

  const data = await getCachedInit(since);
  return NextResponse.json(data);
}
