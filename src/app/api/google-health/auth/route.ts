import { NextResponse } from "next/server";

/** Google Health OAuth 認証を開始する */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.GOOGLE_HEALTH_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/google-health/callback`;

  const scopes = [
    "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
    "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  ].join(" ");

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      access_type: "offline",
      prompt: "consent", // refresh_token を毎回発行させる
    }).toString();

  return NextResponse.redirect(url);
}
