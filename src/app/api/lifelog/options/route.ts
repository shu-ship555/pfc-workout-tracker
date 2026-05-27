import { NextResponse } from "next/server";
import { getMoodSelectOptions } from "@/lib/notion";
import { DEMO_MOOD_OPTIONS } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  if (IS_DEMO) return NextResponse.json(DEMO_MOOD_OPTIONS);
  const options = await getMoodSelectOptions();
  return NextResponse.json(options);
}
