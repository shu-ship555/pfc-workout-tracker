import { NextResponse } from "next/server";
import { listLifeLogs } from "@/lib/notion";
import { jstDaysAgo } from "@/lib/date-utils";
import { getShiftedDemoLifeLogs } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  if (IS_DEMO) {
    // DEMO_LIFE_LOGS の最新日付を「昨日」に合わせてシフト（今日分は未記入想定）
    return NextResponse.json(getShiftedDemoLifeLogs(jstDaysAgo(1)));
  }
  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
