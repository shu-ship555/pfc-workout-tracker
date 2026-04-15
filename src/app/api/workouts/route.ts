import { NextResponse } from "next/server";
import { listWorkouts, createWorkout } from "@/lib/notion";
import { jstDaysAgo, shiftDateStr } from "@/lib/date-utils";
import { DEMO_WORKOUTS, generateDemoId } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  if (IS_DEMO) {
    // DEMO_WORKOUTS の最新日付を「3日前」に合わせてシフト（先週のトレーニングとして表示）
    const target = jstDaysAgo(3);
    const maxDate = DEMO_WORKOUTS.reduce((max, w) => {
      const d = w.created.split("T")[0];
      return d > max ? d : max;
    }, "0000-00-00");
    const shift = Math.round((Date.parse(target) - Date.parse(maxDate)) / 86400000);
    const workouts =
      shift === 0
        ? DEMO_WORKOUTS
        : DEMO_WORKOUTS.map((w) => ({
            ...w,
            created: shiftDateStr(w.created, shift) + w.created.slice(10),
          }));
    return NextResponse.json(workouts);
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
