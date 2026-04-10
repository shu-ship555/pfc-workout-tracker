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
  ResponsiveContainer,
} from "recharts";
import type { WorkoutEntry } from "@/lib/types";

type Part = "胸" | "腕" | "背中" | "脚";

const PARTS: Part[] = ["胸", "腕", "背中", "脚"];

const EXERCISES: Record<Part, string[]> = {
  胸: ["ベンチプレス", "インクラインベンチプレス", "ダンベルフライ", "ペックデックフライ", "ディップス", "チェストプレス"],
  腕: ["アームカール", "バイセップカール", "ハンマーカール", "プリーチャーカール", "スカルクラッシャー", "トライセップスプレッドバー", "ケーブルカール"],
  背中: ["ラットプルダウン", "ベントオーバーロウ", "シーテッドロウ", "デッドリフト", "懸垂（チンアップ）", "アームカール", "フェイスプル"],
  脚: ["スクワット", "レッグプレス", "レッグカール", "レッグエクステンション", "ランジ", "カーフレイズ", "ルーマニアンデッドリフト"],
};

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

  const { chartData, yDomain } = useMemo(() => {
    if (!exercise) return { chartData: [], yDomain: [0, 100] as [number, number] };
    // key = ISO日付 (YYYY-MM-DD) でソート、表示は formatDateShort
    const byDate = new Map<string, number>();
    for (const w of workouts) {
      if (w.exercise !== exercise || w.warmup) continue;
      const isoDate = w.created.slice(0, 10); // "YYYY-MM-DD"
      byDate.set(isoDate, Math.max(byDate.get(isoDate) ?? 0, w.weight));
    }
    const data = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([isoDate, weight]) => ({ date: formatDateShort(isoDate), weight }));

    if (data.length === 0) return { chartData: data, yDomain: [0, 100] as [number, number] };

    const weights = data.map((d) => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max((max - min) * 0.5, 2.5); // 振れ幅の50%か最低2.5kgを余白に
    const lower = Math.max(0, Math.floor((min - padding) / 2.5) * 2.5);
    const upper = Math.ceil((max + padding) / 2.5) * 2.5;

    return { chartData: data, yDomain: [lower, upper] as [number, number] };
  }, [workouts, exercise]);

  if (workouts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">重量の推移</p>
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
              <SelectContent>
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
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
