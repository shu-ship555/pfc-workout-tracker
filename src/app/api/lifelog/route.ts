import { NextResponse } from "next/server";
import { listLifeLogs } from "@/lib/notion";
import { jstDaysAgo } from "@/lib/date-utils";
import { DEMO_LIFE_LOGS } from "@/lib/demo-data";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET() {
  if (IS_DEMO) {
    // DEMO_LIFE_LOGS の最新日付を「昨日」に合わせてシフト（今日分は未記入想定）
    const yesterday = jstDaysAgo(1);
    const maxDate = DEMO_LIFE_LOGS.reduce((max, l) => {
      const n = l.date.replace(/\//g, "-");
      return n > max ? n : max;
    }, "0000-00-00");
    const shift = Math.round((Date.parse(yesterday) - Date.parse(maxDate)) / 86400000);
    const logs =
      shift === 0
        ? DEMO_LIFE_LOGS
        : DEMO_LIFE_LOGS.map((l) => {
            const d = new Date(l.date.replace(/\//g, "-") + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() + shift);
            return { ...l, date: d.toISOString().split("T")[0].replace(/-/g, "/") };
          });
    return NextResponse.json(logs);
  }
  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
