/** "YYYY/MM/DD" 形式の日付を "YYYY-MM-DD" に正規化する */
export function normalizeDate(date: string): string {
  return date.replace(/\//g, "-");
}

const JST_OFFSET = 9 * 60 * 60 * 1000;

/** 現在の JST 日時を Date オブジェクトで返す */
export function jstNow(): Date {
  return new Date(Date.now() + JST_OFFSET);
}

/** JST今日の日付を YYYY-MM-DD で返す */
export function jstToday(): string {
  return jstNow().toISOString().split("T")[0];
}

/** JST で N 日前の日付を YYYY-MM-DD で返す（0 = 今日、1 = 昨日、…） */
export function jstDaysAgo(offsetDays: number): string {
  const d = jstNow();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

/** JST で N ヶ月前の日付を YYYY-MM-DD で返す */
export function jstMonthsAgo(months: number): string {
  const d = jstNow();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().split("T")[0];
}

/** "HH:MM" 形式の入眠・起床から睡眠時間（時間）を計算。日をまたぐケースも対応 */
export function parseSleepDuration(sleepTime: string, wakeTime: string): number | null {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  };
  const s = parse(sleepTime);
  const w = parse(wakeTime);
  if (s === null || w === null) return null;
  let diff = w - s;
  if (diff < 0) diff += 24 * 60;
  return Math.round(diff / 6) / 10;
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

/** 日付文字列を指定日数ぶんシフトして YYYY-MM-DD で返す（デモデータ用） */
export function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}
