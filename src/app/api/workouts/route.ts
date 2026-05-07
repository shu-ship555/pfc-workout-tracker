import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { listWorkouts, createWorkout } from "@/lib/notion";
import { jstToday, jstMonthsAgo } from "@/lib/date-utils";
import { getShiftedDemoWorkouts, generateDemoId } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

const getCachedWorkouts = unstable_cache(
  (since: string) => listWorkouts(since),
  ["workouts"],
  { revalidate: 60, tags: ["workouts"] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam === null ? jstMonthsAgo(3) : (sinceParam || undefined);

  if (IS_DEMO) return NextResponse.json(getShiftedDemoWorkouts(jstToday()));

  const workouts = await getCachedWorkouts(since ?? "");
  return NextResponse.json(workouts);
}

export async function POST(request: Request) {
  const data = await request.json();
  if (IS_DEMO) {
    return NextResponse.json(
      { ...data, id: generateDemoId(), created: new Date().toISOString() },
      { status: 201 }
    );
  }
  const workout = await createWorkout(data);
  revalidateTag("workouts", {});
  return NextResponse.json(workout, { status: 201 });
}
