import { NextResponse } from "next/server";
import { listLifeLogs } from "@/lib/notion";
import { jstToday } from "@/lib/date-utils";
import { getShiftedDemoLifeLogs } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  if (IS_DEMO) {
    // DEMO_LIFE_LOGS の最新日付を「今日」に合わせてシフト
    return NextResponse.json(getShiftedDemoLifeLogs(jstToday()));
  }
  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
