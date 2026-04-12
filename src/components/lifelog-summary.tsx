"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LifeLogEntry } from "@/lib/types";
import { ChartTooltip } from "@/components/chart-tooltip";
import { Moon, Sun, Cloud, Thermometer, Droplets, Footprints, MapPin, Smile, Flame, RefreshCw } from "lucide-react";

type Props = { logs: LifeLogEntry[]; onRefresh?: () => Promise<void> };

function getMoodColor(mood: number): string {
  if (mood <= 1 || mood >= 9) return "text-red-500";
  if (mood <= 3 || mood >= 7) return "text-yellow-500";
  return "text-green-600 dark:text-green-400";
}

function getMoodDotColor(mood: number): string {
  if (mood <= 1 || mood >= 9) return "bg-red-500";
  if (mood <= 3 || mood >= 7) return "bg-yellow-500";
  return "bg-green-600";
}

function MoodDots({ mood }: { mood: number }) {
  const dotColor = getMoodDotColor(mood);
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 11 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${i < mood ? dotColor : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

/** "HH:MM" 形式の入眠・起床から睡眠時間（時間）を計算。日をまたぐケースも対応 */
function parseSleepDuration(sleepTime: string, wakeTime: string): number | null {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  };
  const s = parse(sleepTime);
  const w = parse(wakeTime);
  if (s === null || w === null) return null;
  let diff = w - s;
  if (diff < 0) diff += 24 * 60; // 日をまたぐ場合
  return Math.round(diff / 6) / 10; // 小数点1桁の時間
}

/** "2026/04/11" or "2026-04-11" → "4/11" */
function formatLogDate(date: string): string {
  const parts = date.replace(/-/g, "/").split("/");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}


const LOG_TOOLTIP_DEFS: { key: string; label: string; color: string; format: (v: number) => string }[] = [
  { key: "mood",    label: "気分",     color: "#16a34a",          format: (v) => `${v} / 10` },
  { key: "sleep",   label: "睡眠",     color: "hsl(221 83% 53%)", format: (v) => `${v} 時間` },
  { key: "tempMax", label: "最高気温", color: "#f97316",          format: (v) => `${v}℃` },
  { key: "tempMin", label: "最低気温", color: "#06b6d4",          format: (v) => `${v}℃` },
  { key: "steps",   label: "歩数",     color: "#64748b",          format: (v) => `${v.toLocaleString()} 歩` },
];

export function LifeLogSummary({ logs, onRefresh }: Props) {
  const latest = logs[0] ?? null;
  const [moodOptions, setMoodOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const moodSelect = latest?.moodSelect ?? "";

  useEffect(() => {
    fetch("/api/lifelog/options").then((r) => r.json()).then(setMoodOptions);
  }, []);

  async function handleMoodChange(value: string | null) {
    if (!latest || saving || !value) return;
    setSaving(true);
    await fetch(`/api/lifelog/${latest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodSelect: value }),
    });
    await new Promise((r) => setTimeout(r, 1500));
    await onRefresh?.();
    setSaving(false);
  }

  // 古い順に並べてチャートデータを生成
  const chartData = [...logs]
    .reverse()
    .map((log) => ({
      date: formatLogDate(log.date),
      mood: log.mood,
      sleep: parseSleepDuration(log.sleepTime, log.wakeTime),
      steps: log.steps,
      tempMax: log.tempMax,
      tempMin: log.tempMin,
    }))
    .filter((d) => d.mood != null || d.sleep != null || d.steps != null);

  if (!latest) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-medium">ライフログ</p>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">データを取得できませんでした</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">ライフログ</p>
          <span className="text-xs text-muted-foreground">{latest.date}</span>
        </div>
      </CardHeader>
      <CardContent>

        {chartData.length >= 2 && (
          <>
            {/* 凡例 */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">気分・睡眠・歩数・気温の推移</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-0.5 w-4 rounded-full bg-green-600" />
                  気分
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: "hsl(221 83% 53%)" }} />
                  睡眠
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block w-4 border-t-2 border-dashed border-orange-500" />
                  最高気温
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block w-4 border-t-2 border-dashed border-cyan-500" />
                  最低気温
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-2 w-4 rounded-sm bg-slate-400 opacity-40" />
                  歩数
                </span>
              </div>
            </div>
            {/* SP: 横スクロール / PC: 全幅表示 */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div
                className="w-full"
                style={{ minWidth: Math.max(chartData.length * 28, 320) }}
              >
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 12]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickCount={5}
                      width={28}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      width={28}
                    />
                    {/* 気温専用の非表示軸（-10〜45℃） */}
                    <YAxis yAxisId="temp" domain={[-10, 45]} hide />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltip
                          active={active}
                          label={label != null ? String(label) : undefined}
                          items={LOG_TOOLTIP_DEFS.flatMap((def) => {
                            const entry = payload?.find((p) => p.dataKey === def.key);
                            const v = typeof entry?.value === "number" ? entry.value : null;
                            return v != null ? [{ label: def.label, color: def.color, value: def.format(v) }] : [];
                          })}
                        />
                      )}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="steps"
                      fill="#94a3b8"
                      opacity={0.4}
                      barSize={4}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="sleep"
                      stroke="hsl(221 83% 53%)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="mood"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="temp"
                      type="linear"
                      dataKey="tempMax"
                      stroke="#f97316"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="temp"
                      type="linear"
                      dataKey="tempMin"
                      stroke="#06b6d4"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        <Separator className="mt-4 mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* 気分 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Smile className="h-3.5 w-3.5" />
              気分
            </div>
            {moodSelect && saving ? (
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : moodSelect && latest.mood != null ? (
              <>
                <p className={`text-xl font-bold font-mono mt-0.5 ${getMoodColor(latest.mood)}`}>
                  {latest.mood}
                  <span className="text-xs font-normal ml-0.5">/ 10</span>
                </p>
                <MoodDots mood={latest.mood} />
              </>
            ) : (
              <Select
                value={moodSelect}
                onValueChange={handleMoodChange}
                disabled={saving}
              >
                <SelectTrigger className="h-8 mt-0.5 text-xs border-0 bg-transparent px-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="未入力" />
                </SelectTrigger>
                <SelectContent className="min-w-max">
                  {moodOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 入眠・起床 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Moon className="h-3.5 w-3.5" />
              入眠 / 起床
            </div>
            <p className="text-sm font-mono mt-0.5">
              {latest.sleepTime || "—"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Sun className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm font-mono">{latest.wakeTime || "—"}</p>
            </div>
          </div>

          {/* 天気・気温 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Cloud className="h-3.5 w-3.5" />
              天気 / 気温
            </div>
            <p className="text-sm mt-0.5">{latest.weather || "—"}</p>
            {latest.tempMax != null && latest.tempMin != null ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Thermometer className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">
                  {latest.tempMax.toFixed(1)} / {latest.tempMin.toFixed(1)}℃
                </p>
              </div>
            ) : null}
          </div>

          {/* 湿度・歩数 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" />
              湿度 / 歩数
            </div>
            <p className="text-sm font-mono mt-0.5">
              {latest.humidity != null ? `${latest.humidity}%` : "—"}
            </p>
            {latest.steps != null ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Footprints className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">
                  {latest.steps.toLocaleString()} 歩
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {(latest.city || latest.consumedKcal != null) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {latest.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {latest.city}
              </div>
            )}
            {latest.consumedKcal != null && (
              <div className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                <span className="font-mono">{latest.consumedKcal.toLocaleString()}</span>
                <span>kcal</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
