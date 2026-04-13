import { NextResponse } from "next/server";
import { listWorkouts, createWorkout } from "@/lib/notion";
import { DEMO_WORKOUTS, generateDemoId } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET() {
  if (IS_DEMO) return NextResponse.json(DEMO_WORKOUTS);
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
