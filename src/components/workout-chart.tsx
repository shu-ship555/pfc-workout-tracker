"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { WorkoutEntry } from "@/lib/types";
import { PARTS, EXERCISES, type Part } from "@/lib/exercises";

type Props = { workouts: WorkoutEntry[] };

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

export function WorkoutChart({ workouts }: Props) {
  const [part, setPart] = useState<Part>("胸");
  const [exercise, setExercise] = useState<string>("ベンチプレス");

  function handlePartChange(value: string | null) {
    const next = (value ?? "胸") as Part;
    setPart(next);
    setExercise(EXERCISES[next][0]);
  }

  const { chartData, yDomain, goalWeight } = useMemo(() => {
    if (!exercise) return { chartData: [], yDomain: [0, 100] as [number, number], goalWeight: 0 };
    // key = ISO日付 (YYYY-MM-DD) でソート、表示は formatDateShort
    const byDate = new Map<string, number>();
    let latestGoal = 0;
    let latestCreated = "";
    for (const w of workouts) {
      if (w.exercise !== exercise) continue;
      // 最新の goal を取得（created降順で最初に見つかった非ゼロ値）
      if (w.goal > 0 && w.created > latestCreated) {
        latestGoal = w.goal;
        latestCreated = w.created;
      }
      if (w.warmup) continue;
      const isoDate = w.created.slice(0, 10); // "YYYY-MM-DD"
      byDate.set(isoDate, Math.max(byDate.get(isoDate) ?? 0, w.weight));
    }
    const data = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([isoDate, weight]) => ({ date: formatDateShort(isoDate), weight }));

    if (data.length === 0) return { chartData: data, yDomain: [0, 100] as [number, number], goalWeight: latestGoal };

    const weights = data.map((d) => d.weight);
    const allValues = latestGoal > 0 ? [...weights, latestGoal] : weights;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = Math.max((max - min) * 0.5, 2.5); // 振れ幅の50%か最低2.5kgを余白に
    const lower = Math.max(0, Math.floor((min - padding) / 2.5) * 2.5);
    const upper = Math.ceil((max + padding) / 2.5) * 2.5;

    return { chartData: data, yDomain: [lower, upper] as [number, number], goalWeight: latestGoal };
  }, [workouts, exercise]);

  if (workouts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium whitespace-nowrap">重量の推移</p>
            {goalWeight > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">目標 {goalWeight}kg</span>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={part} onValueChange={handlePartChange}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTS.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={exercise} onValueChange={(v) => setExercise(v ?? exercise)}>
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-max">
                {EXERCISES[part].map((ex) => (
                  <SelectItem key={ex} value={ex} className="text-xs">{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
            データが不足しています（2件以上必要）
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 2, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}kg`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`${value} kg`, "重量"]}
              />
              {goalWeight > 0 && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="hsl(221 83% 53%)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                className="stroke-primary"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-muted-foreground mt-1 text-right">
          ウォームアップを除く最大重量
        </p>
      </CardContent>
    </Card>
  );
}
