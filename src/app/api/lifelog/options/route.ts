import { NextResponse } from "next/server";
import { getMoodSelectOptions } from "@/lib/notion";

export async function GET() {
  const options = await getMoodSelectOptions();
  return NextResponse.json(options);
}
