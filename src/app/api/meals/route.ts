import { NextResponse } from "next/server";
import { listMeals, createMeal } from "@/lib/notion";
import { IS_DEMO, apiError, parseMealBody } from "@/lib/api-utils";
import { jstToday, shiftDateStr } from "@/lib/date-utils";
import { DEMO_MEALS, generateDemoId } from "@/lib/demo-data";

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
    const fields = parseMealBody(body);
    if (IS_DEMO) {
      return NextResponse.json({ id: generateDemoId(), date: jstToday(), ...fields });
    }
    const meal = await createMeal({ date: jstToday(), ...fields });
    return NextResponse.json(meal);
  } catch (e) {
    return apiError(e);
  }
}
