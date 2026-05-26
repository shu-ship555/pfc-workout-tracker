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

  if (!res.ok) throw new Error(`Google Health API error ${res.status}: ${path}`);
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

/** dailyRollUp レスポンスから数値を取り出す（型が不明なため複数フィールドを試みる） */
function extractRollUpValue(data: unknown): number | null {
  const val = (data as any)?.dataPointRollUps?.[0]?.value;
  if (!val) return null;
  const raw = val.integerValue ?? val.int64Value ?? val.intValue ?? val.fpValue ?? val.doubleValue ?? null;
  return raw !== null ? Number(raw) : null;
}

/** 指定日（デフォルト: JST今日）の Google Health データを取得する */
export async function fetchTodayGoogleHealth(dateStr = jstToday()) {
  const date = parseDate(dateStr);
  const nextDateStr = new Date(new Date(dateStr + "T00:00:00+09:00").getTime() + 86400000)
    .toISOString()
    .slice(0, 10);
  const nextDate = parseDate(nextDateStr);
  const range = { start: { date }, end: { date: nextDate } };

  const [stepsResult, caloriesResult, sleepResult, weightResult] = await Promise.allSettled([
    healthPost("/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp", { range }),
    healthPost("/v4/users/me/dataTypes/total-calories/dataPoints:dailyRollUp", { range }),
    // 睡眠は個別セッションが必要なため list エンドポイントを使用
    healthGet("/v4/users/me/dataTypes/sleep/dataPoints?pageSize=5"),
    healthPost("/v4/users/me/dataTypes/weight/dataPoints:dailyRollUp", { range }),
  ]);

  // Steps
  const steps: number | null = stepsResult.status === "fulfilled"
    ? extractRollUpValue(stepsResult.value)
    : null;

  // 消費カロリー
  let consumedKcal: number | null = caloriesResult.status === "fulfilled"
    ? extractRollUpValue(caloriesResult.value)
    : null;
  if (consumedKcal !== null) consumedKcal = Math.round(consumedKcal);

  // 睡眠: 対象日JST内に終わるセッションを探す、なければ直近を使用
  let sleepHours: number | null = null;
  let sleepTime = "";
  let wakeTime = "";
  if (sleepResult.status === "fulfilled") {
    const sessions: any[] = (sleepResult.value as any)?.dataPoints ?? [];

    // 対象日 JST の00:00〜23:59 の ms 範囲
    const dayStart = new Date(dateStr + "T00:00:00+09:00").getTime();
    const dayEnd   = new Date(dateStr + "T23:59:59+09:00").getTime();

    const daySession = sessions.find((s) => {
      const endMs = toMs(s.endTime);
      return endMs !== null && endMs >= dayStart && endMs <= dayEnd;
    });
    const mainSleep = daySession ?? sessions[0] ?? null;

    if (mainSleep) {
      const startMs = toMs(mainSleep.startTime);
      const endMs   = toMs(mainSleep.endTime);
      if (startMs !== null && endMs !== null) {
        // JST でのHH:MM を算出
        const toJstHHMM = (ms: number) =>
          new Date(ms + 9 * 3600 * 1000).toISOString().slice(11, 16);
        sleepTime  = toJstHHMM(startMs);
        wakeTime   = toJstHHMM(endMs);
        sleepHours = Math.round((endMs - startMs) / 60000 / 6) / 10; // 0.1時間単位
      }
    }
  }

  // 体重: 当日データがなければ直近30日の最新を使用
  let weight: number | null = weightResult.status === "fulfilled"
    ? extractRollUpValue(weightResult.value)
    : null;

  if (weight === null) {
    try {
      const pastStart = parseDate(jstDaysAgo(30));
      const rangeData = await healthPost("/v4/users/me/dataTypes/weight/dataPoints:dailyRollUp", {
        range: { start: { date: pastStart }, end: { date: nextDate } },
      }) as any;
      const rollUps: any[] = rangeData?.dataPointRollUps ?? [];
      // 最後（最新日）のデータを使用
      for (let i = rollUps.length - 1; i >= 0; i--) {
        const val = rollUps[i]?.value;
        const raw = val?.fpValue ?? val?.doubleValue ?? null;
        if (raw !== null) { weight = Number(raw); break; }
      }
    } catch {
      // フォールバック失敗は無視
    }
  }

  return { steps, consumedKcal, sleepHours, sleepTime, wakeTime, weight };
}
