import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { listWorkouts, createWorkout } from "@/lib/notion";
import { jstToday, jstMonthsAgo, shiftDateStr } from "@/lib/date-utils";
import { DEMO_WORKOUTS, generateDemoId } from "@/lib/demo-data";
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

  if (IS_DEMO) {
    const target = jstToday();
    const maxDate = DEMO_WORKOUTS.reduce((max, w) => {
      const d = w.created.split("T")[0];
      return d > max ? d : max;
    }, "0000-00-00");
    const shift = Math.round((Date.parse(target) - Date.parse(maxDate)) / 86400000);
    const shifted =
      shift === 0
        ? [...DEMO_WORKOUTS]
        : DEMO_WORKOUTS.map((w) => ({
            ...w,
            created: shiftDateStr(w.created, shift) + w.created.slice(10),
          }));
    shifted.sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
    return NextResponse.json(shifted);
  }

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
  revalidateTag("workouts");
  return NextResponse.json(workout, { status: 201 });
}
