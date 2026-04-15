import { NextResponse } from "next/server";

/** Fitbit OAuth 認証を開始する（初回セットアップ用） */
export async function GET() {
  const clientId = process.env.FITBIT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "FITBIT_CLIENT_ID not configured" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/fitbit/callback`;

  const url =
    `https://www.fitbit.com/oauth2/authorize?` +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "activity sleep weight",
      expires_in: "604800",
    }).toString();

  return NextResponse.redirect(url);
}
