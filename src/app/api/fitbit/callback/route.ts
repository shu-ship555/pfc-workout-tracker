import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Fitbit API は廃止されました。/api/google-health/callback を使用してください。" }, { status: 410 });
}
