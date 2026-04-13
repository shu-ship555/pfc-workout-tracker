import { NextResponse } from "next/server";
import { listLifeLogs } from "@/lib/notion";
import { DEMO_LIFE_LOGS } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET() {
  if (IS_DEMO) return NextResponse.json(DEMO_LIFE_LOGS);
  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
