import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { listMeals, createMeal } from "@/lib/notion";
import { IS_DEMO, apiError, parseMealBody } from "@/lib/api-utils";
import { jstToday, jstMonthsAgo, shiftDateStr } from "@/lib/date-utils";
import { DEMO_MEALS, generateDemoId } from "@/lib/demo-data";

const getCachedMeals = unstable_cache(
  (since: string) => listMeals(since),
  ["meals"],
  { revalidate: 60, tags: ["meals"] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam === null ? jstMonthsAgo(3) : (sinceParam || undefined);

  if (IS_DEMO) {
    const today = jstToday();
    const maxDate = DEMO_MEALS.reduce((max, m) => (m.date > max ? m.date : max), DEMO_MEALS[0].date);
    const shift = Math.round((Date.parse(today) - Date.parse(maxDate)) / 86400000);
    const meals = shift === 0 ? DEMO_MEALS : DEMO_MEALS.map((m) => ({ ...m, date: shiftDateStr(m.date, shift) }));
    return NextResponse.json(meals);
  }

  const meals = await getCachedMeals(since ?? "");
  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fields = parseMealBody(body);
    if (IS_DEMO) {
      return NextResponse.json({ id: generateDemoId(), date: jstToday(), ...fields });
    }
    const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : jstToday();
    const meal = await createMeal({ date, ...fields });
    revalidateTag("meals");
    return NextResponse.json(meal);
  } catch (e) {
    return apiError(e);
  }
}
