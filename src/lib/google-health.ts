import { getGoogleHealthTokens, setGoogleHealthTokens } from "./notion";
import { jstToday, jstDaysAgo } from "./date-utils";

/** Google Health refresh_token が無効化されたことを示すエラー */
export class GoogleHealthAuthError extends Error {
  constructor(message = "Google Health refresh token invalid — re-auth required") {
    super(message);
    this.name = "GoogleHealthAuthError";
  }
}

const BASE_URL = "https://health.googleapis.com";

let tokenCache: { accessToken: string; refreshToken: string } | null = null;

async function loadTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  if (tokenCache) return tokenCache;

  if (process.env.NOTION_CONFIG_DATABASE_ID) {
    try {
      const tokens = await getGoogleHealthTokens();
      if (tokens.accessToken && tokens.refreshToken) {
        tokenCache = tokens;
        return tokenCache;
      }
    } catch (err) {
      console.warn("[google-health] Notion token load failed, falling back to env:", err);
    }
  }

  tokenCache = {
    accessToken: process.env.GOOGLE_HEALTH_ACCESS_TOKEN ?? "",
    refreshToken: process.env.GOOGLE_HEALTH_REFRESH_TOKEN ?? "",
  };
  return tokenCache;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefreshAccessToken(): Promise<string> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google credentials not configured");
  }

  let refreshToken: string;
  if (process.env.NOTION_CONFIG_DATABASE_ID) {
    try {
      const tokens = await getGoogleHealthTokens();
      refreshToken = tokens.refreshToken;
    } catch {
      refreshToken = tokenCache?.refreshToken ?? process.env.GOOGLE_HEALTH_REFRESH_TOKEN ?? "";
    }
  } else {
    refreshToken = tokenCache?.refreshToken ?? process.env.GOOGLE_HEALTH_REFRESH_TOKEN ?? "";
  }

  if (!refreshToken) throw new Error("GOOGLE_HEALTH_REFRESH_TOKEN not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data?.error === "invalid_grant") {
      throw new GoogleHealthAuthError(`Google Health refresh token invalid: ${data.error_description}`);
    }
    throw new Error(`Google Health token refresh failed: ${JSON.stringify(data)}`);
  }

  // Google は新しい refresh_token を返さない場合がある
  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
  };
  await setGoogleHealthTokens(tokenCache.accessToken, tokenCache.refreshToken);

  return data.access_token as string;
}

async function healthGet(path: string): Promise<unknown> {
  const { accessToken } = await loadTokens();
  if (!accessToken) throw new Error("GOOGLE_HEALTH_ACCESS_TOKEN not configured");

  const request = (token: string) =>
    fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let res = await request(accessToken);
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    res = await request(newToken);
  }

  if (!res.ok) throw new Error(`Google Health API error ${res.status}: ${path}`);
  return res.json();
}

async function healthPost(path: string, body: unknown): Promise<unknown> {
  const { accessToken } = await loadTokens();
  if (!accessToken) throw new Error("GOOGLE_HEALTH_ACCESS_TOKEN not configured");

  const request = (token: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let res = await request(accessToken);
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    res = await request(newToken);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Google Health API error ${res.status}: ${path} — ${errBody}`);
  }
  return res.json();
}

/** "YYYY-MM-DD" → {year, month, day} */
function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

/** タイムスタンプを ms に変換（ISO文字列 / Unix秒オブジェクト 両対応） */
function toMs(t: unknown): number | null {
  if (!t) return null;
  if (typeof t === "string") return new Date(t).getTime();
  if (typeof t === "number") return t * 1000;
  if (typeof t === "object" && t !== null && "seconds" in t) return Number((t as any).seconds) * 1000;
  return null;
}

/** 指定日（デフォルト: JST今日）の Google Health データを取得する */
export async function fetchTodayGoogleHealth(dateStr = jstToday()) {
  const date = parseDate(dateStr);
  // UTC で翌日を計算（JST オフセット変換を避ける）
  const nextDateStr = new Date(Date.UTC(date.year, date.month - 1, date.day + 1))
    .toISOString()
    .slice(0, 10);
  const nextDate = parseDate(nextDateStr);
  const range = { start: { date }, end: { date: nextDate } };
  // window_size_days: 1 は dailyRollUp に必須（Google Health API 仕様）
  const rollUpBody = { range, window_size_days: 1 };

  const [stepsResult, caloriesResult, sleepResult, weightResult] = await Promise.allSettled([
    healthPost("/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp", rollUpBody),
    healthPost("/v4/users/me/dataTypes/total-calories/dataPoints:dailyRollUp", rollUpBody),
    healthGet("/v4/users/me/dataTypes/sleep/dataPoints?pageSize=5"),
    healthPost("/v4/users/me/dataTypes/weight/dataPoints:dailyRollUp", rollUpBody),
  ]);

  // 認証エラーは上位に伝播させて再認証フローを起動する
  for (const result of [stepsResult, caloriesResult, sleepResult, weightResult]) {
    if (result.status === "rejected" && result.reason instanceof GoogleHealthAuthError) {
      throw result.reason;
    }
  }

  // Steps: rollupDataPoints[0].steps.countSum
  const stepsRaw = (stepsResult.status === "fulfilled" ? stepsResult.value : null) as any;
  if (stepsResult.status === "rejected") console.error("[google-health] steps error:", stepsResult.reason);
  const steps: number | null = stepsRaw?.rollupDataPoints?.[0]?.steps?.countSum != null
    ? Number(stepsRaw.rollupDataPoints[0].steps.countSum)
    : null;

  // 消費カロリー: rollupDataPoints[0].totalCalories.kcalSum
  const calRaw = (caloriesResult.status === "fulfilled" ? caloriesResult.value : null) as any;
  if (caloriesResult.status === "rejected") console.error("[google-health] calories error:", caloriesResult.reason);
  const consumedKcal: number | null = calRaw?.rollupDataPoints?.[0]?.totalCalories?.kcalSum != null
    ? Math.round(calRaw.rollupDataPoints[0].totalCalories.kcalSum)
    : null;

  // 睡眠: dataPoints[n].sleep.interval.startTime/endTime (UTC RFC3339)
  let sleepHours: number | null = null;
  let sleepTime = "";
  let wakeTime = "";
  if (sleepResult.status === "fulfilled") {
    const sessions: any[] = (sleepResult.value as any)?.dataPoints ?? [];

    // 対象日 JST の 00:00〜23:59 に endTime が収まるセッションを探す
    const dayStart = new Date(dateStr + "T00:00:00+09:00").getTime();
    const dayEnd   = new Date(dateStr + "T23:59:59+09:00").getTime();

    const daySession = sessions.find((s) => {
      const endMs = toMs(s.sleep?.interval?.endTime);
      return endMs !== null && endMs >= dayStart && endMs <= dayEnd;
    });
    const mainSleep = daySession ?? sessions[0] ?? null;

    if (mainSleep?.sleep?.interval) {
      const startMs = toMs(mainSleep.sleep.interval.startTime);
      const endMs   = toMs(mainSleep.sleep.interval.endTime);
      if (startMs !== null && endMs !== null) {
        const toJstHHMM = (ms: number) =>
          new Date(ms + 9 * 3600 * 1000).toISOString().slice(11, 16);
        sleepTime  = toJstHHMM(startMs);
        wakeTime   = toJstHHMM(endMs);
        sleepHours = Math.round((endMs - startMs) / 60000 / 6) / 10;
      }
    }
  }

  // 体重: rollupDataPoints[0].weight.weightGramsAvg (g → kg)
  const weightRaw = (weightResult.status === "fulfilled" ? weightResult.value : null) as any;
  const weightGrams = weightRaw?.rollupDataPoints?.[0]?.weight?.weightGramsAvg;
  // g → kg (小数1桁: 100g単位で丸める)
  const gramsToKg = (g: number) => Math.round(g / 100) / 10;
  let weight: number | null = weightGrams != null ? gramsToKg(weightGrams) : null;

  // 当日データがなければ直近30日の最新を使用
  if (weight === null) {
    try {
      const pastStart = parseDate(jstDaysAgo(30));
      const rangeData = await healthPost("/v4/users/me/dataTypes/weight/dataPoints:dailyRollUp", {
        range: { start: { date: pastStart }, end: { date: nextDate } },
      }) as any;
      const rollUps: any[] = rangeData?.rollupDataPoints ?? [];
      const lastGrams = rollUps.at(-1)?.weight?.weightGramsAvg;
      if (lastGrams != null) weight = gramsToKg(lastGrams);
    } catch {
      // フォールバック失敗は無視
    }
  }

  return { steps, consumedKcal, sleepHours, sleepTime, wakeTime, weight };
}
