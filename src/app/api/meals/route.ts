import { NextResponse } from "next/server";
import { listMeals, createMeal } from "@/lib/notion";
import { apiError } from "@/lib/api-utils";
import { jstToday } from "@/lib/date-utils";
import { DEMO_MEALS, generateDemoId } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export async function GET() {
  if (IS_DEMO) {
    const today = jstToday();
    const maxDate = DEMO_MEALS.reduce((max, m) => (m.date > max ? m.date : max), DEMO_MEALS[0].date);
    const shift = Math.round((Date.parse(today) - Date.parse(maxDate)) / 86400000);
    const meals = shift === 0 ? DEMO_MEALS : DEMO_MEALS.map((m) => ({ ...m, date: shiftDateStr(m.date, shift) }));
    return NextResponse.json(meals);
  }
  const meals = await listMeals();
  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (IS_DEMO) {
      return NextResponse.json({
        id: generateDemoId(),
        date: jstToday(),
        name: String(body.name),
        kcal: Number(body.kcal) || 0,
        protein: Number(body.protein) || 0,
        fat: Number(body.fat) || 0,
        carb: Number(body.carb) || 0,
      });
    }
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
