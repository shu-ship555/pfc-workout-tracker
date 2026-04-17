import { NextResponse } from "next/server";
import { updateVercelEnvVar } from "@/lib/fitbit";

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

  await Promise.all([
    updateVercelEnvVar("FITBIT_ACCESS_TOKEN", data.access_token),
    updateVercelEnvVar("FITBIT_REFRESH_TOKEN", data.refresh_token),
  ]);

  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json({
    success: true,
    message: isDev
      ? "Fitbit認証が完了しました。下記を .env.local にコピーしてください。"
      : "Fitbit認証が完了しました。",
    ...(isDev && {
      env: {
        FITBIT_ACCESS_TOKEN: data.access_token,
        FITBIT_REFRESH_TOKEN: data.refresh_token,
      },
    }),
  });
}
