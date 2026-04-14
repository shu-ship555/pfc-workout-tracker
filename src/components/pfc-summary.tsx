"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import type { MealEntry, LifeLogEntry } from "@/lib/types";
import { PFC_COLORS } from "@/lib/color-constants";
import { jstDaysAgo } from "@/lib/date-utils";

type Period = "today" | "yesterday" | "3days" | "7days";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today",     label: "今日" },
  { value: "yesterday", label: "前日" },
  { value: "3days",     label: "過去3日" },
  { value: "7days",     label: "過去1週間" },
];

// "2026/04/11" → "2026-04-11"
function normalizeLifeLogDate(date: string): string {
  return date.replace(/\//g, "-");
}

function filterMeals(meals: MealEntry[], period: Period): MealEntry[] {
  switch (period) {
    case "today":
      return meals.filter((m) => m.date === jstDaysAgo(0));
    case "yesterday":
      return meals.filter((m) => m.date === jstDaysAgo(1));
    case "3days": {
      const dates = new Set([jstDaysAgo(1), jstDaysAgo(2), jstDaysAgo(3)]);
      return meals.filter((m) => dates.has(m.date));
    }
    case "7days": {
      const dates = new Set(Array.from({ length: 7 }, (_, i) => jstDaysAgo(i + 1)));
      return meals.filter((m) => dates.has(m.date));
    }
  }
}

function filterConsumedKcal(logs: LifeLogEntry[], period: Period): number | null {
  let dates: string[];
  switch (period) {
    case "today":
      dates = [jstDaysAgo(0)];
      break;
    case "yesterday":
      dates = [jstDaysAgo(1)];
      break;
    case "3days":
      dates = [jstDaysAgo(1), jstDaysAgo(2), jstDaysAgo(3)];
      break;
    case "7days":
      dates = Array.from({ length: 7 }, (_, i) => jstDaysAgo(i + 1));
      break;
  }
  const dateSet = new Set(dates);
  const matched = logs.filter((l) => dateSet.has(normalizeLifeLogDate(l.date)) && l.consumedKcal != null);
  if (matched.length === 0) return null;
  return matched.reduce((s, l) => s + (l.consumedKcal ?? 0), 0);
}

type EditData = { name: string; kcal: number; protein: number; fat: number; carb: number };

type Props = {
  meals: MealEntry[];
  lifeLogs: LifeLogEntry[];
  loading?: boolean;
  onMealDelete?: (id: string) => void;
  onMealUpdate?: (meal: MealEntry) => void;
};

export function PFCSummary({ meals, lifeLogs, loading, onMealDelete, onMealUpdate }: Props) {
  const [period, setPeriod] = useState<Period>("today");
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteLatest() {
    try {
      const res = await fetch("/api/meals/latest", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg(`⚠ ${data.error ?? "削除に失敗しました"}`);
      } else {
        setDeleteMsg(`削除しました: ${data.name}`);
        onMealDelete?.(data.id);
      }
    } catch {
      setDeleteMsg("削除に失敗しました");
    }
    setTimeout(() => setDeleteMsg(null), 3000);
  }

  async function handleDeleteMeal(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      if (res.ok) onMealDelete?.(id);
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(meal: MealEntry) {
    setEditingId(meal.id);
    setEditData({ name: meal.name, kcal: meal.kcal, protein: meal.protein, fat: meal.fat, carb: meal.carb });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }

  async function handleUpdateMeal(id: string, date: string) {
    if (!editData) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, date }),
      });
      if (res.ok) {
        const updated: MealEntry = await res.json();
        onMealUpdate?.(updated);
        setEditingId(null);
        setEditData(null);
      }
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-7 w-full mt-3" />
        </CardContent>
      </Card>
    );
  }

  const filtered = filterMeals(meals, period);
  const protein = filtered.reduce((s, m) => s + m.protein, 0);
  const fat     = filtered.reduce((s, m) => s + m.fat, 0);
  const carb    = filtered.reduce((s, m) => s + m.carb, 0);
  const kcal    = filtered.reduce((s, m) => s + m.kcal, 0);
  const consumed = filterConsumedKcal(lifeLogs, period);

  const items = [
    { label: "P タンパク質", value: protein, unit: "g",    color: PFC_COLORS.protein },
    { label: "F 脂質",       value: fat,     unit: "g",    color: PFC_COLORS.fat },
    { label: "C 炭水化物",   value: carb,    unit: "g",    color: PFC_COLORS.carb },
    { label: "カロリー",     value: kcal,    unit: "kcal", color: PFC_COLORS.kcal },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="inline-flex h-8 items-center rounded-md bg-muted p-0.5 gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { setPeriod(p.value); if (p.value !== "today") setShowList(false); }}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className={`rounded-lg px-3 pt-1.5 pb-2 ${item.color}`}>
              <p className="text-xs font-medium opacity-70">{item.label}</p>
              {item.unit === "kcal" && consumed != null ? (
                <>
                  <p className="text-lg font-bold font-mono leading-tight mt-0.5">
                    {item.value.toFixed(0)}
                    <span className="text-xs font-normal mx-0.5">/</span>
                    {consumed.toFixed(0)}
                    <span className="text-xs font-normal ml-0.5">kcal</span>
                  </p>
                  {item.value > consumed && (
                    <div className="flex items-center gap-0.5 mt-0.5 text-red-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">摂取超過</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xl font-bold font-mono">
                  {item.value.toFixed(item.unit === "kcal" ? 0 : 1)}
                  <span className="text-xs font-normal ml-0.5">{item.unit}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 今日タブのみ: 食事リストトグル */}
        {period === "today" && (
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>今日の食事 ({filtered.length}件)</span>
            {showList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}

        {period === "today" && showList && (
          <div className="mt-1 overflow-hidden rounded-md">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">記録なし</p>
            ) : (
              filtered.map((meal, index) => (
                <div key={meal.id} className={index % 2 === 0 ? "bg-muted/40" : "bg-background"}>
                  {editingId === meal.id && editData ? (
                    <div className="px-3 py-2 space-y-2">
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData((d) => d && { ...d, name: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="料理名"
                      />
                      <div className="grid grid-cols-4 gap-1.5">
                        {([ { key: "kcal", label: "kcal" }, { key: "protein", label: "P(g)" }, { key: "fat", label: "F(g)" }, { key: "carb", label: "C(g)" } ] as const).map(({ key, label }) => (
                          <div key={key} className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={editData[key] || ""}
                              onChange={(e) => setEditData((d) => d && { ...d, [key]: Number(e.target.value) })}
                              className="h-7 text-xs px-2"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border">
                          <X className="h-3 w-3" />キャンセル
                        </button>
                        <button
                          type="button"
                          disabled={savingId === meal.id}
                          onClick={() => handleUpdateMeal(meal.id, meal.date)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-1 rounded border border-primary/30 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />{savingId === meal.id ? "保存中..." : "保存"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="flex-1 text-xs truncate">{meal.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {meal.kcal}kcal P{meal.protein} F{meal.fat} C{meal.carb}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(meal)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === meal.id}
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={handleDeleteLatest}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            直近の食事を削除
          </button>
          <p className="text-xs text-muted-foreground">
            {deleteMsg ?? (filtered.length > 0 ? `${filtered.length} 食分の合計` : "記録なし")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
