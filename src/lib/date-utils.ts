/** "YYYY/MM/DD" 形式の日付を "YYYY-MM-DD" に正規化する */
export function normalizeDate(date: string): string {
  return date.replace(/\//g, "-");
}

/** JST今日の日付を YYYY-MM-DD で返す */
export function jstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
}

/** JST で N 日前の日付を YYYY-MM-DD で返す（0 = 今日、1 = 昨日、…） */
export function jstDaysAgo(offsetDays: number): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

/** JST で N ヶ月前の日付を YYYY-MM-DD で返す */
export function jstMonthsAgo(months: number): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().split("T")[0];
}

/** ISO日時文字列を MM/DD HH:MM 形式にフォーマット（テーブル日時表示用） */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO日付文字列を M月D日 形式にフォーマット（チャートX軸ラベル用） */
export function formatDateShort(isoOrYMD: string): string {
  return new Date(isoOrYMD).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

/** "2026/04/11" または "2026-04-11" を M/D 形式にフォーマット（ライフログチャート用） */
export function formatLogDate(date: string): string {
  const parts = date.replace(/-/g, "/").split("/");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}
