import { NextResponse } from "next/server";
import { listMeals, createMeal } from "@/lib/notion";
import { apiError } from "@/lib/api-utils";
import { jstToday } from "@/lib/date-utils";

export async function GET() {
  const meals = await listMeals();
  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const meal = await createMeal({
      name: String(body.name),
      date: jstToday(),
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
