"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DateRangeInput } from "@/components/date-range-input";
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
import { EXERCISES, type Part } from "@/lib/exercises";
import { ChartTooltip } from "@/components/chart-tooltip";
import { PartSelect, ExerciseSelect } from "@/components/workout-selects";
import { CHART_COLORS } from "@/lib/color-constants";
import { jstToday, jstMonthsAgo, formatDateShort } from "@/lib/date-utils";

type Props = { workouts: WorkoutEntry[] };

export function WorkoutChart({ workouts }: Props) {
  const [part, setPart] = useState<Part>("胸");
  const [exercise, setExercise] = useState<string>("ベンチプレス");
  const [filterDateFrom, setFilterDateFrom] = useState(() => jstMonthsAgo(3));
  const [filterDateTo, setFilterDateTo] = useState(() => jstToday());

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
      const isoDate = w.created.slice(0, 10);
      if (filterDateFrom && isoDate < filterDateFrom) continue;
      if (filterDateTo && isoDate > filterDateTo) continue;
      // 最新の goal を取得（created降順で最初に見つかった非ゼロ値）
      if (w.goal > 0 && w.created > latestCreated) {
        latestGoal = w.goal;
        latestCreated = w.created;
      }
      if (w.warmup) continue;
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
    const padding = Math.max((max - min) * 0.5, 2.5);
    const lower = Math.max(0, Math.floor((min - padding) / 2.5) * 2.5);
    const upper = Math.ceil((max + padding) / 2.5) * 2.5;

    return { chartData: data, yDomain: [lower, upper] as [number, number], goalWeight: latestGoal };
  }, [workouts, exercise, filterDateFrom, filterDateTo]);

  if (workouts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium whitespace-nowrap">重量の推移</p>
            {goalWeight > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">目標 {goalWeight}kg</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeInput
              from={filterDateFrom}
              to={filterDateTo}
              onFromChange={setFilterDateFrom}
              onToChange={setFilterDateTo}
              inputClassName="h-8 w-32 text-xs"
            />
            <PartSelect
              value={part}
              onValueChange={handlePartChange}
              triggerClassName="h-8 w-20 text-xs"
            />
            <ExerciseSelect
              value={exercise}
              part={part}
              onValueChange={(v) => setExercise(v ?? exercise)}
              triggerClassName="h-8 w-44 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
            データが不足しています（2件以上必要）
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div style={{ minWidth: Math.max(chartData.length * 28, 320) }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 2, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}kg`}
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        label={label != null ? String(label) : undefined}
                        items={payload?.[0]?.value != null ? [
                          { label: "重量", color: "var(--color-primary)", value: `${String(payload[0].value)} kg` },
                        ] : []}
                      />
                    )}
                  />
                  {goalWeight > 0 && (
                    <ReferenceLine
                      y={goalWeight}
                      stroke={CHART_COLORS.goal}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}
                  <Line
                    type="linear"
                    dataKey="weight"
                    stroke={CHART_COLORS.weight}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1 text-right">
          ウォームアップを除く最大重量
        </p>
      </CardContent>
    </Card>
  );
}
