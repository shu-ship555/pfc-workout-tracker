/**
 * セマンティックカラー定数（唯一の色管理ファイル）
 *
 * DESIGN.md の「セマンティックカラー」パレットに対応。
 * Tailwindのハードコード色を直接コンポーネントに書かず、必ずここからインポートして使う。
 * チャート用 CSS 変数文字列もここで一元管理する。
 */

// ─── PFC・カロリー ──────────────────────────────────────────────────────────
// DESIGN.md セマンティックカラー: 青(P) / 黄(F) / 緑(C) / 橙(kcal)

export const PFC_COLORS = {
  protein: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  fat:     "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  carb:    "bg-green-500/10 text-green-700 dark:text-green-400",
  kcal:    "bg-orange-500/10 text-orange-700 dark:text-orange-400",
} as const;

// ─── 気分スコア ──────────────────────────────────────────────────────────────
// 0〜10 スケール: 極端(≤1/≥9) → 赤、中間(≤3/≥7) → 黄、良好 → 緑

export const MOOD_COLORS = {
  bad:     { text: "text-red-700 dark:text-red-400",       dot: "bg-red-500"    },
  warning: { text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  good:    { text: "text-green-700 dark:text-green-400",   dot: "bg-green-600"  },
} as const;

export function getMoodColorClass(mood: number): string {
  if (mood <= 1 || mood >= 9) return MOOD_COLORS.bad.text;
  if (mood <= 3 || mood >= 7) return MOOD_COLORS.warning.text;
  return MOOD_COLORS.good.text;
}

export function getMoodDotClass(mood: number): string {
  if (mood <= 1 || mood >= 9) return MOOD_COLORS.bad.dot;
  if (mood <= 3 || mood >= 7) return MOOD_COLORS.warning.dot;
  return MOOD_COLORS.good.dot;
}

// ─── バッジフラグ ────────────────────────────────────────────────────────────
// outline バッジ上のフラグ色。セマンティックパレットの黄・赤を使用

export const FLAG_COLORS = {
  rebound:  "text-yellow-700 dark:text-yellow-400",
  unstable: "text-red-700 dark:text-red-400",
} as const;

// ─── ステータス ──────────────────────────────────────────────────────────────
// 操作の成否を示すフィードバック色。DESIGN.md セマンティックカラー（緑/赤）を使用

export const STATUS_COLORS = {
  success: "bg-green-500/10 text-green-700 dark:text-green-400",
  alert:   "text-red-700 dark:text-red-400",
} as const;

// ─── デモモードバナー ────────────────────────────────────────────────────────
// DESIGN.md セマンティックカラー: 黄（注意）系を使用

export const DEMO_BANNER = {
  bg:     "bg-amber-500/10",
  border: "border-amber-500/30",
  text:   "text-amber-600 dark:text-amber-400",
} as const;

// ─── チャートストローク（recharts props 向け CSS 変数文字列）────────────────

export const CHART_COLORS = {
  mood:    "var(--color-green-600)",
  sleep:   "var(--color-blue-600)",
  tempMax: "var(--color-orange-500)",
  tempMin: "var(--color-cyan-500)",
  steps:   "var(--color-slate-400)",
  weight:  "var(--color-blue-600)",
  goal:    "hsl(221 83% 53%)",
} as const;
