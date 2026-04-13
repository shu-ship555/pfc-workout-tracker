import { NextResponse } from "next/server";
import { getMoodSelectOptions } from "@/lib/notion";
import { DEMO_MOOD_OPTIONS } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET() {
  if (IS_DEMO) return NextResponse.json(DEMO_MOOD_OPTIONS);
  const options = await getMoodSelectOptions();
  return NextResponse.json(options);
}
