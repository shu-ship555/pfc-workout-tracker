import { NextResponse } from "next/server";
import { deleteMeal, updateMeal } from "@/lib/notion";
import { IS_DEMO, apiError, parseMealBody } from "@/lib/api-utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (IS_DEMO) return NextResponse.json({ ok: true });
  try {
    const { id } = await params;
    await deleteMeal(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const fields = parseMealBody(body);
    const date = String(body.date ?? "");
    if (IS_DEMO) {
      return NextResponse.json({ id, date, ...fields });
    }
    const meal = await updateMeal(id, { date, ...fields });
    return NextResponse.json(meal);
  } catch (e) {
    return apiError(e);
  }
}
