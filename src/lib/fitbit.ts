/** Vercel環境変数を Vercel API 経由で更新する */
export async function updateVercelEnvVar(key: string, value: string): Promise<void> {
  const apiToken = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!apiToken || !projectId) return;

  const qs = teamId ? `?teamId=${teamId}` : "";
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!listRes.ok) {
    throw new Error(`Vercel env list failed: ${listRes.status} ${await listRes.text()}`);
  }
  const listData = await listRes.json();
  const envs: { id: string; key: string }[] = listData.envs ?? [];
  const targets = envs.filter((e) => e.key === key);

  await Promise.all(
    targets.map(async (env) => {
      const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${env.id}${qs}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        throw new Error(`Vercel env update failed for ${key}: ${res.status} ${await res.text()}`);
      }
    })
  );
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
  const { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_REFRESH_TOKEN } = process.env;
  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET || !FITBIT_REFRESH_TOKEN) {
    throw new Error("Fitbit credentials not configured");
  }

  const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: FITBIT_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Fitbit token refresh failed: ${JSON.stringify(data.errors)}`);

  // 現在のプロセスにも即反映
  process.env.FITBIT_ACCESS_TOKEN = data.access_token;
  process.env.FITBIT_REFRESH_TOKEN = data.refresh_token;

  // Vercel 環境変数の永続化を待つ（失敗すると次回 invocation で invalid_grant になるため）
  await Promise.all([
    updateVercelEnvVar("FITBIT_ACCESS_TOKEN", data.access_token),
    updateVercelEnvVar("FITBIT_REFRESH_TOKEN", data.refresh_token),
  ]);

  return data.access_token as string;
}

/** Fitbit API への GET リクエスト（401 時は自動リフレッシュ） */
async function fitbitGet(path: string): Promise<unknown> {
  if (!process.env.FITBIT_ACCESS_TOKEN) throw new Error("FITBIT_ACCESS_TOKEN not set");

  const request = (token: string) =>
    fetch(`https://api.fitbit.com${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let res = await request(process.env.FITBIT_ACCESS_TOKEN);
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
