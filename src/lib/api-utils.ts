import { NextResponse } from "next/server";

/** API Route 用: エラーを NextResponse に変換して返す */
export function apiError(e: unknown, status = 500): NextResponse {
  const message = e instanceof Error ? e.message : "Unknown error";
  return NextResponse.json({ error: message }, { status });
}
