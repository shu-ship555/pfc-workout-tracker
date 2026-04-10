import { NextResponse } from "next/server";
import { listMeals } from "@/lib/notion";

export async function GET() {
  const meals = await listMeals();
  return NextResponse.json(meals);
}
