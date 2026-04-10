import { NextResponse } from "next/server";
import { listWorkouts, createWorkout } from "@/lib/notion";

export async function GET() {
  const workouts = await listWorkouts();
  return NextResponse.json(workouts);
}

export async function POST(request: Request) {
  const data = await request.json();
  const workout = await createWorkout(data);
  return NextResponse.json(workout, { status: 201 });
}
