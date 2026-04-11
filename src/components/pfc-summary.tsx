"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MealEntry } from "@/lib/types";

type Period = "today" | "yesterday" | "3days" | "7days";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today",     label: "今日" },
  { value: "yesterday", label: "前日" },
  { value: "3days",     label: "過去3日" },
  { value: "7days",     label: "過去1週間" },
];

function dateString(offsetDays: number): string {
  // JST (UTC+9) の日付を基準にする
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

function filterMeals(meals: MealEntry[], period: Period): MealEntry[] {
  switch (period) {
    case "today":
      return meals.filter((m) => m.date === dateString(0));
    case "yesterday":
      return meals.filter((m) => m.date === dateString(1));
    case "3days": {
      const dates = new Set([dateString(1), dateString(2), dateString(3)]);
      return meals.filter((m) => dates.has(m.date));
    }
    case "7days": {
      const dates = new Set(
        Array.from({ length: 7 }, (_, i) => dateString(i + 1))
      );
      return meals.filter((m) => dates.has(m.date));
    }
  }
}

type Props = { meals: MealEntry[] };

export function PFCSummary({ meals }: Props) {
  const [period, setPeriod] = useState<Period>("today");

  const filtered = filterMeals(meals, period);
  const protein = filtered.reduce((s, m) => s + m.protein, 0);
  const fat     = filtered.reduce((s, m) => s + m.fat, 0);
  const carb    = filtered.reduce((s, m) => s + m.carb, 0);
  const kcal    = filtered.reduce((s, m) => s + m.kcal, 0);

  const items = [
    { label: "P タンパク質", value: protein, unit: "g",    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "F 脂質",       value: fat,     unit: "g",    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
    { label: "C 炭水化物",   value: carb,    unit: "g",    color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "カロリー",     value: kcal,    unit: "kcal", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="inline-flex h-8 items-center rounded-md bg-muted p-0.5 gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className={`rounded-lg px-3 py-2 ${item.color}`}>
              <p className="text-xs font-medium opacity-70">{item.label}</p>
              <p className="text-xl font-bold font-mono">
                {item.value.toFixed(item.unit === "kcal" ? 0 : 1)}
                <span className="text-xs font-normal ml-0.5">{item.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {filtered.length > 0 ? `${filtered.length} 食分の合計` : "記録なし"}
        </p>
      </CardContent>
    </Card>
  );
}
