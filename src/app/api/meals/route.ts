import { NextResponse } from "next/server";
import { listMeals, createMeal } from "@/lib/notion";

export async function GET() {
  const meals = await listMeals();
  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const meal = await createMeal({
      name: String(body.name),
      date: today,
      kcal: Number(body.kcal) || 0,
      protein: Number(body.protein) || 0,
      fat: Number(body.fat) || 0,
      carb: Number(body.carb) || 0,
    });
    return NextResponse.json(meal);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
