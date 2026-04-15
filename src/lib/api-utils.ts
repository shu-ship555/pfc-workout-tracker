import { NextResponse } from "next/server";

/** デモモードフラグ（全 API ルートで共有） */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** API Route 用: エラーを NextResponse に変換して返す */
export function apiError(e: unknown, status = 500): NextResponse {
  const message = e instanceof Error ? e.message : "Unknown error";
  return NextResponse.json({ error: message }, { status });
}

/** リクエストボディから Meal フィールドをパースする */
export function parseMealBody(body: Record<string, unknown>) {
  return {
    name:    String(body.name ?? ""),
    kcal:    Number(body.kcal)    || 0,
    protein: Number(body.protein) || 0,
    fat:     Number(body.fat)     || 0,
    carb:    Number(body.carb)    || 0,
  };
}
