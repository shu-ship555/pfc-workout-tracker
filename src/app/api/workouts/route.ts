import { NextResponse } from "next/server";
import { listWorkouts, createWorkout } from "@/lib/notion";
import { jstToday, shiftDateStr } from "@/lib/date-utils";
import { DEMO_WORKOUTS, generateDemoId } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  if (IS_DEMO) {
    // DEMO_WORKOUTS の最新日付を「今日」に合わせてシフト
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
  const workouts = await listWorkouts();
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
  return NextResponse.json(workout, { status: 201 });
}
