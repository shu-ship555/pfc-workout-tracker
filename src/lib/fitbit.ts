import { getFitbitTokens, setFitbitTokens } from "./notion";

/** Fitbit の refresh_token が無効化された（invalid_grant）ことを示すエラー */
export class FitbitAuthError extends Error {
  constructor(message = "Fitbit refresh token invalid — re-auth required") {
    super(message);
    this.name = "FitbitAuthError";
  }
}

// ウォームインスタンス内でのトークンキャッシュ
let tokenCache: { accessToken: string; refreshToken: string } | null = null;

async function loadTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  if (tokenCache) return tokenCache;

  if (process.env.NOTION_CONFIG_DATABASE_ID) {
    try {
      const tokens = await getFitbitTokens();
      if (tokens.accessToken && tokens.refreshToken) {
        tokenCache = tokens;
        return tokenCache;
      }
    } catch (err) {
      console.warn("[fitbit] Notion token load failed, falling back to env:", err);
    }
  }

  // フォールバック: 環境変数（初回セットアップ時）
  tokenCache = {
    accessToken: process.env.FITBIT_ACCESS_TOKEN ?? "",
    refreshToken: process.env.FITBIT_REFRESH_TOKEN ?? "",
  };
  return tokenCache;
}

// refresh_token は使い捨てのため、並行実行を1回に集約する
let refreshPromise: Promise<string> | null = null;

async function refreshFitbitToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshFitbitToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefreshFitbitToken(): Promise<string> {
  const { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET } = process.env;
  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
    throw new Error("Fitbit credentials not configured");
  }

  // リフレッシュ時は常に Notion から最新トークンを読む（再認証後のキャッシュ陳腐化対策）
  let refreshToken: string;
  if (process.env.NOTION_CONFIG_DATABASE_ID) {
    try {
      const tokens = await getFitbitTokens();
      refreshToken = tokens.refreshToken;
    } catch {
      refreshToken = tokenCache?.refreshToken ?? process.env.FITBIT_REFRESH_TOKEN ?? "";
    }
  } else {
    refreshToken = tokenCache?.refreshToken ?? process.env.FITBIT_REFRESH_TOKEN ?? "";
  }

  if (!refreshToken) throw new Error("FITBIT_REFRESH_TOKEN not configured");

  const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorType = data?.errors?.[0]?.errorType;
    if (errorType === "invalid_grant") {
      throw new FitbitAuthError(`Fitbit refresh token invalid: ${JSON.stringify(data.errors)}`);
    }
    throw new Error(`Fitbit token refresh failed: ${JSON.stringify(data.errors)}`);
  }

  // キャッシュ更新
  tokenCache = { accessToken: data.access_token, refreshToken: data.refresh_token };

  // Notion に永続化
  await setFitbitTokens(data.access_token, data.refresh_token);

  return data.access_token as string;
}

/** Fitbit API への GET リクエスト（401 時は自動リフレッシュ） */
async function fitbitGet(path: string): Promise<unknown> {
  const { accessToken } = await loadTokens();
  if (!accessToken) throw new Error("FITBIT_ACCESS_TOKEN not configured");

  const request = (token: string) =>
    fetch(`https://api.fitbit.com${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let res = await request(accessToken);
  if (res.status === 401) {
    const newToken = await refreshFitbitToken();
    res = await request(newToken);
  }

  if (!res.ok) throw new Error(`Fitbit API error ${res.status}: ${path}`);
  return res.json();
}

/** 今日のFitbitデータ（活動・睡眠）を取得する */
export async function fetchTodayFitbit() {
  // Fitbit API は "today" エイリアスを受け付けないため、JST の実日付を使用
  const jstToday = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

  const [activitiesData, sleepData, weightData] = await Promise.all([
    fitbitGet(`/1/user/-/activities/date/${jstToday}.json`) as Promise<{
      summary?: { steps?: number; caloriesOut?: number };
    }>,
    fitbitGet(`/1.2/user/-/sleep/date/${jstToday}.json`) as Promise<{
      sleep?: { isMainSleep?: boolean; startTime?: string; endTime?: string }[];
      summary?: { totalMinutesAsleep?: number };
    }>,
    fitbitGet(`/1/user/-/body/log/weight/date/${jstToday}.json`) as Promise<{
      body?: { weight?: number }[];
    }>,
  ]);

  const summary = activitiesData.summary ?? {};
  const steps: number | null = summary.steps ?? null;
  const consumedKcal: number | null = summary.caloriesOut ?? null;

  const sleepLogs = sleepData.sleep ?? [];
  const mainSleep = sleepLogs.find((s) => s.isMainSleep) ?? sleepLogs[0];
  const sleepMinutes = sleepData.summary?.totalMinutesAsleep ?? null;
  const sleepHours = sleepMinutes != null ? Math.round(sleepMinutes / 6) / 10 : null;

  // startTime 形式: "2024-01-15T23:30:00.000" → "23:30"
  const sleepTime = mainSleep?.startTime?.slice(11, 16) ?? "";
  const wakeTime = mainSleep?.endTime?.slice(11, 16) ?? "";

  // 今日の体重がなければ過去30日の直近データを使用
  let weight: number | null = weightData.body?.[0]?.weight ?? null;
  if (weight === null) {
    const jstStart = new Date(Date.now() + 9 * 3600_000 - 30 * 86400_000).toISOString().slice(0, 10);
    const rangeData = await fitbitGet(`/1/user/-/body/log/weight/date/${jstStart}/${jstToday}.json`) as {
      weight?: { weight?: number }[];
    };
    const logs = rangeData.weight ?? [];
    weight = logs.at(-1)?.weight ?? null;
  }

  return { steps, consumedKcal, sleepHours, sleepTime, wakeTime, weight };
}
