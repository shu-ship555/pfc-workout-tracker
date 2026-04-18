import { NextResponse } from "next/server";
import { updateVercelEnvVar, triggerRedeploy } from "@/lib/fitbit";

/** Fitbit OAuth コールバック。認証コードをトークンに交換し Vercel 環境変数に保存する */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  const { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET } = process.env;
  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
    return NextResponse.json({ error: "Fitbit credentials not configured" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/fitbit/callback`;

  const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[fitbit/callback] token exchange failed:", {
      redirectUri,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "(unset)",
      VERCEL_URL: process.env.VERCEL_URL ?? "(unset)",
      error: data,
    });
    return NextResponse.json({ error: data, debug: { redirectUri } }, { status: 400 });
  }

  process.env.FITBIT_ACCESS_TOKEN = data.access_token;
  process.env.FITBIT_REFRESH_TOKEN = data.refresh_token;

  let envUpdateError: string | null = null;
  try {
    await Promise.all([
      updateVercelEnvVar("FITBIT_ACCESS_TOKEN", data.access_token),
      updateVercelEnvVar("FITBIT_REFRESH_TOKEN", data.refresh_token),
    ]);
    await triggerRedeploy();
  } catch (err) {
    console.error("[fitbit/callback] Vercel env update failed:", err);
    envUpdateError = err instanceof Error ? err.message : String(err);
  }

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return NextResponse.json({
      success: true,
      message: "Fitbit認証が完了しました。下記を .env.local にコピーしてください。",
      env: {
        FITBIT_ACCESS_TOKEN: data.access_token,
        FITBIT_REFRESH_TOKEN: data.refresh_token,
      },
    });
  }

  // 本番: 親ウィンドウにpostMessageして自動的に閉じるHTMLを返す
  const message = !envUpdateError
    ? "Fitbit認証が完了しました。"
    : `Fitbit認証は完了しましたが、Vercel環境変数の更新に失敗しました: ${envUpdateError}`;
  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><title>Fitbit 認証完了</title></head>
<body>
<p>${message}</p>
<script>
if (window.opener) {
  window.opener.postMessage({ type: 'fitbit-auth-complete' }, window.location.origin);
}
window.close();
</script>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
