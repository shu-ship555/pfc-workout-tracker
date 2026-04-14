"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getMoodColorClass, getMoodDotClass, CHART_COLORS } from "@/lib/color-constants";
import { formatLogDate, jstDaysAgo } from "@/lib/date-utils";
import { Moon, Sun, Cloud, Thermometer, Droplets, Footprints, MapPin, Smile, Flame, RefreshCw } from "lucide-react";

type Props = { logs: LifeLogEntry[]; loading?: boolean; onRefresh?: () => Promise<void> };

function MoodDots({ mood }: { mood: number }) {
  const dotColor = getMoodDotClass(mood);
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

const LOG_TOOLTIP_DEFS: { key: string; label: string; color: string; format: (v: number) => string }[] = [
  { key: "mood",    label: "気分",     color: CHART_COLORS.mood,    format: (v) => `${v} / 10` },
  { key: "sleep",   label: "睡眠",     color: CHART_COLORS.sleep,   format: (v) => `${v} 時間` },
  { key: "tempMax", label: "最高気温", color: CHART_COLORS.tempMax, format: (v) => `${v}℃` },
  { key: "tempMin", label: "最低気温", color: CHART_COLORS.tempMin, format: (v) => `${v}℃` },
  { key: "steps",   label: "歩数",     color: CHART_COLORS.steps,   format: (v) => `${v.toLocaleString()} 歩` },
];

export function LifeLogSummary({ logs, loading, onRefresh }: Props) {
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

  // 最新90日分に絞り、古い順に並べてチャートデータを生成
  const ninetyDaysAgoStr = jstDaysAgo(90);
  const chartData = [...logs]
    .filter((log) => log.date.replace(/\//g, "-") >= ninetyDaysAgoStr)
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-px w-full mt-4 mb-6" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
              <p className="text-xs text-muted-foreground">気分・睡眠・歩数・気温の推移</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: CHART_COLORS.mood }} />
                  気分
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: CHART_COLORS.sleep }} />
                  睡眠
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.tempMax }} />
                  最高気温
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.tempMin }} />
                  最低気温
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="inline-block h-2 w-4 rounded-sm opacity-40" style={{ background: CHART_COLORS.steps }} />
                  歩数
                </span>
              </div>
            </div>
            {/* 常にスクロール可能、データ量に応じた最小幅 */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div style={{ minWidth: Math.max(chartData.length * 28, 320) }}>
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
                      fill={CHART_COLORS.steps}
                      opacity={0.4}
                      barSize={4}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="sleep"
                      stroke={CHART_COLORS.sleep}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="mood"
                      stroke={CHART_COLORS.mood}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="temp"
                      type="linear"
                      dataKey="tempMax"
                      stroke={CHART_COLORS.tempMax}
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
                      stroke={CHART_COLORS.tempMin}
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
            {saving ? (
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <Select value={moodSelect} onValueChange={handleMoodChange}>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <SelectTrigger className={`h-auto text-xl font-bold font-mono border-0 bg-transparent px-0 shadow-none focus:ring-0 w-auto ${moodSelect && latest.mood != null ? getMoodColorClass(latest.mood) : "text-muted-foreground"}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <span className="text-xs font-normal text-muted-foreground">/ 10</span>
                  </div>
                  <SelectContent className="min-w-max">
                    {moodOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {moodSelect && latest.mood != null && <MoodDots mood={latest.mood} />}
              </>
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

          {/* 歩数・湿度 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Footprints className="h-3.5 w-3.5" />
              歩数 / 湿度
            </div>
            <p className="text-sm font-mono mt-0.5">
              {latest.steps != null ? `${latest.steps.toLocaleString()} 歩` : "—"}
            </p>
            {latest.humidity != null ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Droplets className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">
                  {latest.humidity}%
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
