import { NextResponse } from "next/server";
import { fetchTodayWeather } from "@/lib/weather";
import { fetchTodayFitbit, FitbitAuthError } from "@/lib/fitbit";
import { upsertTodayLifeLog, listLifeLogs } from "@/lib/notion";
import { jstToday, jstDaysAgo } from "@/lib/date-utils";
import { getShiftedDemoLifeLogs } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET(request: Request) {
  // デモモード: /api/lifelog と同じデータを返す
  if (IS_DEMO) {
    return NextResponse.json(getShiftedDemoLifeLogs(jstToday()));
  }

  // cronからの呼び出し(?source=cron)は前日データを対象にする
  // （デバイスが一晩同期する時間を確保するため）
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get("source") === "cron" ? jstDaysAgo(1) : jstToday();

  const city = process.env.OPENWEATHER_CITY ?? "Tokyo";

  // 天気・Fitbit を並列取得。片方が失敗しても続行
  const [weatherResult, fitbitResult] = await Promise.allSettled([
    process.env.OPENWEATHER_API_KEY
      ? fetchTodayWeather(city, process.env.OPENWEATHER_API_KEY)
      : Promise.reject(new Error("OPENWEATHER_API_KEY not set")),
    process.env.NOTION_CONFIG_DATABASE_ID
      ? fetchTodayFitbit(targetDate)
      : Promise.reject(new Error("NOTION_CONFIG_DATABASE_ID not set")),
  ]);

  if (weatherResult.status === "rejected") {
    console.error("[daily-summary] Weather fetch failed:", weatherResult.reason);
  }
  if (fitbitResult.status === "rejected") {
    console.error("[daily-summary] Fitbit fetch failed:", fitbitResult.reason);
  }

  const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const fitbit = fitbitResult.status === "fulfilled" ? fitbitResult.value : null;

  // Notion に upsert（失敗してもデータは返す）
  try {
    await upsertTodayLifeLog({
      city,
      weather: weather?.weather ?? "",
      tempMax: weather?.tempMax ?? null,
      tempMin: weather?.tempMin ?? null,
      humidity: weather?.humidity ?? null,
      steps: fitbit?.steps ?? null,
      consumedKcal: fitbit?.consumedKcal ?? null,
      sleepHours: fitbit?.sleepHours ?? null,
      sleepTime: fitbit?.sleepTime ?? "",
      wakeTime: fitbit?.wakeTime ?? "",
      weight: fitbit?.weight ?? null,
    }, targetDate);
  } catch (err) {
    console.error("[daily-summary] Notion upsert failed:", err);
  }

  const logs = await listLifeLogs();
  const headers: Record<string, string> = {};
  if (fitbitResult.status === "rejected" && fitbitResult.reason instanceof FitbitAuthError) {
    headers["x-fitbit-auth-error"] = "1";
  }
  return NextResponse.json(logs, { headers });
}
