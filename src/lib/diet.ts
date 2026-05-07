import type { DietGoal, MealEntry, LifeLogEntry } from "./types";
import { KCAL_PER_KG } from "./types";
import { normalizeDate } from "./date-utils";

export type DietProgressResult = {
  mealsByDate: Record<string, number>;
  consumedByDate: Record<string, number | null>;
  cumulative: number;
  daysWithData: number;
  progressKcal: number;
  targetKcal: number;
  dailyTarget: number | null;
};

/**
 * ゴール期間内の累積カロリー収支・日次目標などを計算する。
 * meals/lifeLogs/goal を受け取り、複数コンポーネントで共有するダイエット進捗値を返す。
 */
export function calcDietProgress(
  goal: DietGoal,
  meals: MealEntry[],
  lifeLogs: LifeLogEntry[],
  todayStr: string,
): DietProgressResult {
  const mealsByDate: Record<string, number> = {};
  for (const m of meals) {
    const d = normalizeDate(m.date).slice(0, 10);
    mealsByDate[d] = (mealsByDate[d] ?? 0) + m.kcal;
  }

  const consumedByDate: Record<string, number | null> = {};
  for (const l of lifeLogs) {
    consumedByDate[normalizeDate(l.date).slice(0, 10)] = l.consumedKcal;
  }

  let cumulative = 0;
  let daysWithData = 0;
  for (const d of new Set([...Object.keys(mealsByDate), ...Object.keys(consumedByDate)])) {
    if (d > todayStr) continue;
    if (goal.startDate && d < goal.startDate) continue;
    if (goal.endDate && d > goal.endDate) continue;
    const intake = mealsByDate[d] ?? null;
    const consumed = consumedByDate[d] ?? null;
    if (intake !== null && consumed !== null) {
      cumulative += intake - consumed;
      daysWithData++;
    }
  }

  const targetKcal = goal.targetKg * KCAL_PER_KG;
  const progressKcal = goal.type === "lose" ? -cumulative : cumulative;
  const remaining = targetKcal - progressKcal;

  let dailyTarget: number | null = null;
  if (goal.startDate && goal.endDate && goal.targetKg > 0) {
    const remainingDays =
      Math.ceil(
        (new Date(goal.endDate + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) /
          86400_000,
      ) + 1;
    if (remainingDays > 0 && remaining > 0) {
      dailyTarget = Math.ceil(remaining / remainingDays);
    }
  }

  return { mealsByDate, consumedByDate, cumulative, daysWithData, progressKcal, targetKcal, dailyTarget };
}
