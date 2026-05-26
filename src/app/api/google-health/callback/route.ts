import { NextResponse } from "next/server";
import { setGoogleHealthTokens } from "@/lib/notion";

/** Google OAuth コールバック。認証コードをトークンに交換し Notion Config DB に保存する */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Google credentials not configured" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/google-health/callback`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[google-health/callback] token exchange failed:", {
      redirectUri,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "(unset)",
      VERCEL_URL: process.env.VERCEL_URL ?? "(unset)",
      error: data,
    });
    return NextResponse.json({ error: data, debug: { redirectUri } }, { status: 400 });
  }

  let saveError: string | null = null;
  try {
    await setGoogleHealthTokens(data.access_token, data.refresh_token);
  } catch (err) {
    console.error("[google-health/callback] Notion token save failed:", err);
    saveError = err instanceof Error ? err.message : String(err);
  }

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return NextResponse.json({
      success: true,
      message: "Google Health 認証が完了しました。トークンは Notion Config DB に保存されました。",
      ...(saveError && { warning: saveError }),
      env: {
        GOOGLE_HEALTH_ACCESS_TOKEN: data.access_token,
        GOOGLE_HEALTH_REFRESH_TOKEN: data.refresh_token,
      },
    });
  }

  const message = !saveError
    ? "Google Health 認証が完了しました。"
    : `Google Health 認証は完了しましたが、Notion への保存に失敗しました: ${saveError}`;
  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><title>Google Health 認証完了</title></head>
<body>
<p>${message}</p>
<script>
if (window.opener) {
  window.opener.postMessage({ type: 'google-health-auth-complete' }, window.location.origin);
}
window.close();
</script>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
