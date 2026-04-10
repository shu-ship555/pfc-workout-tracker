import { NextResponse } from "next/server";
import { updateWorkout, deleteWorkout } from "@/lib/notion";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const workout = await updateWorkout(id, data);
  return NextResponse.json(workout);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteWorkout(id);
  return new NextResponse(null, { status: 204 });
}
