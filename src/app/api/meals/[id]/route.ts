import { NextResponse } from "next/server";
import { deleteMeal, updateMeal } from "@/lib/notion";
import { apiError } from "@/lib/api-utils";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
    if (IS_DEMO) {
      return NextResponse.json({
        id,
        name: String(body.name),
        date: String(body.date),
        kcal: Number(body.kcal) || 0,
        protein: Number(body.protein) || 0,
        fat: Number(body.fat) || 0,
        carb: Number(body.carb) || 0,
      });
    }
    const meal = await updateMeal(id, {
      name: String(body.name),
      date: String(body.date),
      kcal: Number(body.kcal) || 0,
      protein: Number(body.protein) || 0,
      fat: Number(body.fat) || 0,
      carb: Number(body.carb) || 0,
    });
    return NextResponse.json(meal);
  } catch (e) {
    return apiError(e);
  }
}
