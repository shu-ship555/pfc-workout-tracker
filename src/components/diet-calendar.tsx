"use client";

import { useState, useMemo, useEffect } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Settings, Pencil, Check, X } from "lucide-react";
import type { MealEntry, LifeLogEntry, DietGoal } from "@/lib/types";
import { KCAL_PER_KG } from "@/lib/types";
import { apiPost, apiPatch } from "@/lib/api-client";
import { PFC_COLORS } from "@/lib/color-constants";
import { normalizeDate, jstToday, jstNow } from "@/lib/date-utils";
import { calcDietProgress, formatBalance } from "@/lib/diet";

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type DayBalance = {
  intake: number | null;
  consumed: number | null;
  balance: number | null;
};

type Props = {
  meals: MealEntry[];
  lifeLogs: LifeLogEntry[];
  goal: DietGoal;
  loading?: boolean;
  onSettingsOpen?: () => void;
  onMealAdd?: (meal: MealEntry) => void;
  onLifeLogUpdate?: (id: string, consumedKcal: number) => void;
};

export function DietCalendar({ meals, lifeLogs, goal, loading, onSettingsOpen, onMealAdd, onLifeLogUpdate }: Props) {
  const todayStr = jstToday();
  const [viewYear, setViewYear] = useState(() => parseInt(todayStr.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(todayStr.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addKcal, setAddKcal] = useState("");
  const [editingConsumed, setEditingConsumed] = useState(false);
  const [editConsumedKcal, setEditConsumedKcal] = useState("");
  const { isPending: addSubmitting, run } = useAsyncAction();
  const { isPending: consumedSubmitting, run: runConsumedUpdate } = useAsyncAction();

  useEffect(() => {
    setAddName("");
    setAddKcal("");
    setEditingConsumed(false);
    setEditConsumedKcal("");
  }, [selectedDate]);

  async function handleAdd() {
    if (!selectedDate || !addKcal) return;
    await run(async () => {
      const meal = await apiPost<MealEntry>("/api/meals", {
        name: addName.trim() || "追加入力",
        kcal: Number(addKcal),
        protein: 0,
        fat: 0,
        carb: 0,
        date: selectedDate,
      });
      onMealAdd?.(meal);
      setAddName("");
      setAddKcal("");
    });
  }

  async function handleConsumedUpdate(logId: string) {
    const kcal = Number(editConsumedKcal);
    if (!kcal || kcal <= 0) return;
    await runConsumedUpdate(async () => {
      await apiPatch(`/api/lifelog/${logId}`, { consumedKcal: kcal });
      onLifeLogUpdate?.(logId, kcal);
      setEditingConsumed(false);
      setEditConsumedKcal("");
    });
  }

  const { mealsByDate, consumedByDate, cumulative, daysWithData, progressKcal, targetKcal, dailyTarget } = useMemo(
    () => calcDietProgress(goal, meals, lifeLogs, todayStr),
    [goal, meals, lifeLogs, todayStr],
  );

  function getDayBalance(dateStr: string): DayBalance {
    const intake = mealsByDate[dateStr] ?? null;
    const consumed = consumedByDate[dateStr] ?? null;
    const balance = intake !== null && consumed !== null ? intake - consumed : null;
    return { intake, consumed, balance };
  }

  const { weightChange, progress, estimatedLabel } = useMemo(() => {
    const weightChange = cumulative / KCAL_PER_KG;
    const progress = Math.min(100, Math.max(0, (progressKcal / targetKcal) * 100));
    let estimatedLabel: string | null = null;
    if (daysWithData > 0) {
      const avgDaily = cumulative / daysWithData;
      const dailyProgress = goal.type === "lose" ? -avgDaily : avgDaily;
      const remaining = targetKcal - progressKcal;
      if (progress >= 100) {
        estimatedLabel = "達成済み";
      } else if (dailyProgress > 0 && remaining > 0) {
        const daysToGoal = Math.ceil(remaining / dailyProgress);
        const est = new Date(jstNow().getTime() + daysToGoal * 86400_000);
        estimatedLabel = `${est.getUTCMonth() + 1}/${est.getUTCDate()} 達成予定`;
      }
    }
    return { weightChange, progress, estimatedLabel };
  }, [cumulative, daysWithData, progressKcal, targetKcal, goal.type]);

  const calendarDays = useMemo(() => {
    const firstDow = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const lastDate = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const days: (string | null)[] = Array<null>(firstDow).fill(null);
    for (let d = 1; d <= lastDate; d++) {
      days.push(
        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      );
    }
    return days;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const currentYM = todayStr.slice(0, 7);
  const viewYM = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const minYM = useMemo(() => {
    if (goal.startDate) return goal.startDate.slice(0, 7);
    const allDates = [...Object.keys(mealsByDate), ...Object.keys(consumedByDate)];
    if (allDates.length === 0) return currentYM;
    return allDates.reduce((min, d) => d.slice(0, 7) < min ? d.slice(0, 7) : min, allDates[0].slice(0, 7));
  }, [mealsByDate, consumedByDate, currentYM, goal.startDate]);

  const maxYM = goal.endDate
    ? (goal.endDate.slice(0, 7) < currentYM ? goal.endDate.slice(0, 7) : currentYM)
    : currentYM;
  const isPrevDisabled = viewYM <= minYM;
  const isNextDisabled = viewYM >= maxYM;
  const isLose = goal.type === "lose";

  function cellClass(balance: number | null, dateStr: string): string {
    if (dateStr > todayStr || balance === null || balance === 0) return "";
    const good = isLose ? balance < 0 : balance > 0;
    const strong = Math.abs(balance) >= 500;
    return good
      ? (strong ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-green-500/10 text-green-600 dark:text-green-500")
      : (strong ? "bg-red-500/20 text-red-700 dark:text-red-400" : "bg-red-500/10 text-red-600 dark:text-red-500");
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-5 w-24 mx-auto mb-2" />
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{isLose ? "減量" : "増量"}カレンダー</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onSettingsOpen}
            aria-label="ダイエット目標設定"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            目標 <span className="font-bold">{isLose ? "-" : "+"}{goal.targetKg}kg</span>
          </span>
          <span className="text-foreground/40 mx-0.5">|</span>
          {(goal.startDate || goal.endDate) && (
            <span className="text-xs text-muted-foreground font-bold">
              {goal.startDate ? goal.startDate : (
                <button onClick={onSettingsOpen} className="underline underline-offset-2">開始日を設定</button>
              )}
              {" 〜 "}
              {goal.endDate ? goal.endDate : (
                <button onClick={onSettingsOpen} className="underline underline-offset-2">終了日を設定</button>
              )}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* サマリー */}
        <div className={`grid gap-2 mb-4 ${dailyTarget !== null ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <p className="text-[10px] text-muted-foreground">累積収支</p>
            <p className={`text-base font-bold font-mono mt-0.5 ${(isLose ? cumulative <= 0 : cumulative >= 0) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {cumulative >= 0 ? "+" : ""}{Math.round(cumulative).toLocaleString()}
              <span className="text-[10px] font-normal ml-0.5">kcal</span>
            </p>
          </div>
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <p className="text-[10px] text-muted-foreground">体重換算</p>
            <p className={`text-base font-bold font-mono mt-0.5 ${(isLose ? weightChange <= 0 : weightChange >= 0) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {weightChange >= 0 ? "+" : ""}{weightChange.toFixed(2)}
              <span className="text-[10px] font-normal ml-0.5">kg</span>
            </p>
          </div>
          {dailyTarget !== null && (
            <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
              <p className="text-[10px] text-muted-foreground">今日の目標カロリー</p>
              <p className="text-base font-bold font-mono mt-0.5">
                {isLose ? "-" : "+"}{dailyTarget.toLocaleString()}
                <span className="text-[10px] font-normal ml-0.5">kcal</span>
              </p>
            </div>
          )}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">進捗</p>
              {estimatedLabel && (
                <p className="text-[10px] text-muted-foreground leading-tight">{estimatedLabel}</p>
              )}
            </div>
            <p className="text-base font-bold font-mono mt-0.5">
              {progress.toFixed(0)}<span className="text-[10px] font-normal">%</span>
            </p>
            <div className="h-1 rounded-full bg-muted-foreground/20 mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : isLose ? "bg-blue-500" : "bg-orange-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth} disabled={isPrevDisabled}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{viewYear}年{viewMonth + 1}月</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} disabled={isNextDisabled}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-0.5">
          {DOW_LABELS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-medium py-0.5 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}
            >
              {d}
            </div>
          ))}
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) return <div key={`pad-${i}`} />;
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isBeforeStart = goal.startDate ? dateStr < goal.startDate : false;
            const isAfterEnd = goal.endDate ? dateStr > goal.endDate : false;
            const isOutOfRange = isBeforeStart || isAfterEnd;
            const dow = new Date(dateStr + "T00:00:00Z").getUTCDay();
            const { balance } = getDayBalance(dateStr);
            const dayNum = parseInt(dateStr.slice(8));

            return (
              <div
                key={dateStr}
                onClick={() => !isFuture && !isOutOfRange && setSelectedDate(dateStr)}
                className={`rounded p-0.5 flex flex-col items-center min-h-12.5 ${isOutOfRange ? "" : cellClass(balance, dateStr)} ${isToday ? "ring-1 ring-primary" : ""} ${isFuture || isOutOfRange ? "opacity-25" : ""} ${!isFuture && !isOutOfRange ? "cursor-pointer hover:ring-1 hover:ring-muted-foreground/40" : ""}`}
              >
                <span className={`text-[10px] font-mono leading-tight self-start pl-0.5 ${isToday ? "font-bold text-primary" : dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                  {dayNum}
                </span>
                {!isFuture && !isOutOfRange && balance !== null && (
                  <span className="text-[9px] font-mono leading-tight mt-auto">
                    {formatBalance(balance)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-500/20 inline-block" />
            {isLose ? "消費 > 摂取" : "摂取 > 消費"}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500/20 inline-block" />
            {isLose ? "摂取 > 消費" : "消費 > 摂取"}
          </span>
        </div>
      </CardContent>

      {/* 日付クリック: 食事詳細ダイアログ */}
      {(() => {
        const dayMeals = selectedDate
          ? meals.filter((m) => normalizeDate(m.date).slice(0, 10) === selectedDate)
          : [];
        const totalKcal = dayMeals.reduce((s, m) => s + m.kcal, 0);
        const totalProtein = dayMeals.reduce((s, m) => s + m.protein, 0);
        const totalFat = dayMeals.reduce((s, m) => s + m.fat, 0);
        const totalCarb = dayMeals.reduce((s, m) => s + m.carb, 0);
        const { consumed } = selectedDate ? getDayBalance(selectedDate) : { consumed: null };
        const selectedLog = selectedDate
          ? lifeLogs.find((l) => normalizeDate(l.date).slice(0, 10) === selectedDate) ?? null
          : null;
        const [_y, mo, d] = (selectedDate ?? "").split("-");

        return (
          <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
            <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-md max-h-[80dvh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-sm">
                  {selectedDate ? `${parseInt(mo)}月${parseInt(d)}日の食事` : ""}
                </DialogTitle>
              </DialogHeader>

              {/* PFC 合計バッジ */}
              <div className="grid grid-cols-4 gap-2 shrink-0">
                {([
                  { label: "P", value: totalProtein, unit: "g", color: PFC_COLORS.protein },
                  { label: "F", value: totalFat, unit: "g", color: PFC_COLORS.fat },
                  { label: "C", value: totalCarb, unit: "g", color: PFC_COLORS.carb },
                  { label: "kcal", value: totalKcal, unit: "kcal", color: PFC_COLORS.kcal },
                ] as const).map((item) => (
                  <div key={item.label} className={`rounded-lg px-2 pt-1 pb-1.5 ${item.color}`}>
                    <p className="text-[10px] font-medium opacity-70">{item.label}</p>
                    <p className="text-sm font-bold font-mono leading-tight">
                      {item.unit === "kcal" ? Math.round(item.value) : item.value.toFixed(1)}
                      <span className="text-[9px] font-normal ml-0.5">{item.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* 消費カロリーとの比較 */}
              {(consumed != null || selectedLog != null) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground shrink-0">
                  {editingConsumed ? (
                    <>
                      <span>消費カロリー</span>
                      <Input
                        type="number"
                        value={editConsumedKcal}
                        onChange={(e) => setEditConsumedKcal(e.target.value)}
                        className="h-6 text-xs w-24 inline-flex"
                        min={1}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && selectedLog) handleConsumedUpdate(selectedLog.id);
                          if (e.key === "Escape") { setEditingConsumed(false); setEditConsumedKcal(""); }
                        }}
                      />
                      <span>kcal</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={!editConsumedKcal || consumedSubmitting}
                        onClick={() => selectedLog && handleConsumedUpdate(selectedLog.id)}
                      >
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => { setEditingConsumed(false); setEditConsumedKcal(""); }}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span>
                        消費カロリー{" "}
                        <span className="font-mono text-foreground">
                          {consumed != null ? `${consumed.toLocaleString()} kcal` : "未取得"}
                        </span>
                      </span>
                      {selectedLog && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => {
                            setEditConsumedKcal(consumed != null ? String(consumed) : "");
                            setEditingConsumed(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {consumed != null && (
                        <>
                          <span>|</span>
                          <span>
                            収支{" "}
                            <span className={`font-mono font-medium ${totalKcal < consumed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {totalKcal < consumed ? "-" : "+"}{Math.abs(totalKcal - consumed).toLocaleString()} kcal
                            </span>
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 食事リスト */}
              <div className="overflow-y-auto flex-1 min-h-0 space-y-1">
                {dayMeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">食事記録なし</p>
                ) : dayMeals.map((meal) => (
                  <div key={meal.id} className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 bg-muted/40">
                    <span className="text-xs flex-1 truncate">{meal.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 whitespace-nowrap">
                      {meal.kcal}kcal P{meal.protein} F{meal.fat} C{meal.carb}
                    </span>
                  </div>
                ))}
              </div>

              {/* カロリー追加フォーム */}
              <div className="flex items-center gap-2 shrink-0 pt-2 border-t">
                <Input
                  placeholder="料理名（省略可）"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="h-7 text-xs flex-1"
                />
                <Input
                  type="number"
                  placeholder="kcal"
                  value={addKcal}
                  onChange={(e) => setAddKcal(e.target.value)}
                  className="h-7 text-xs w-20"
                  min={1}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  disabled={!addKcal || addSubmitting}
                  onClick={handleAdd}
                >
                  {addSubmitting ? "追加中..." : "追加"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </Card>
  );
}
