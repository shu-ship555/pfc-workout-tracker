import { NextResponse } from "next/server";
import { updateWorkout, deleteWorkout } from "@/lib/notion";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  if (IS_DEMO) {
    return NextResponse.json({ ...data, id, created: new Date().toISOString() });
  }
  const workout = await updateWorkout(id, data);
  return NextResponse.json(workout);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (IS_DEMO) return new NextResponse(null, { status: 204 });
  const { id } = await params;
  await deleteWorkout(id);
  return new NextResponse(null, { status: 204 });
}
