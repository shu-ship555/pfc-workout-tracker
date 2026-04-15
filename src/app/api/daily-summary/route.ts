import { NextResponse } from "next/server";
import { fetchTodayWeather } from "@/lib/weather";
import { fetchTodayFitbit } from "@/lib/fitbit";
import { upsertTodayLifeLog, listLifeLogs } from "@/lib/notion";
import { jstToday } from "@/lib/date-utils";
import { getShiftedDemoLifeLogs } from "@/lib/demo-data";
import { IS_DEMO } from "@/lib/api-utils";

export async function GET() {
  // デモモード: /api/lifelog と同じデータを返す
  if (IS_DEMO) {
    return NextResponse.json(getShiftedDemoLifeLogs(jstToday()));
  }

  const city = process.env.OPENWEATHER_CITY ?? "Tokyo";

  // 天気・Fitbit を並列取得。片方が失敗しても続行
  const [weatherResult, fitbitResult] = await Promise.allSettled([
    process.env.OPENWEATHER_API_KEY
      ? fetchTodayWeather(city, process.env.OPENWEATHER_API_KEY)
      : Promise.reject(new Error("OPENWEATHER_API_KEY not set")),
    process.env.FITBIT_ACCESS_TOKEN
      ? fetchTodayFitbit()
      : Promise.reject(new Error("FITBIT_ACCESS_TOKEN not set")),
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
    });
  } catch (err) {
    console.error("[daily-summary] Notion upsert failed:", err);
  }

  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
