"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LifeLogEntry } from "@/lib/types";
import { Moon, Sun, Cloud, Thermometer, Droplets, Footprints, MapPin, Smile } from "lucide-react";

type Props = { logs: LifeLogEntry[] };

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

export function LifeLogSummary({ logs }: Props) {
  const latest = logs[0] ?? null;

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 気分 */}
          <div className="rounded-lg px-3 pt-1.5 pb-2 bg-muted/50">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Smile className="h-3.5 w-3.5" />
              気分
            </div>
            {latest.mood !== null ? (
              <>
                <p className={`text-xl font-bold font-mono mt-0.5 ${getMoodColor(latest.mood!)}`}>
                  {latest.mood}
                  <span className="text-xs font-normal ml-0.5">/ 10</span>
                </p>
                <MoodDots mood={latest.mood} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">—</p>
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
            {latest.tempMax !== null && latest.tempMin !== null ? (
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
              {latest.humidity !== null ? `${latest.humidity}%` : "—"}
            </p>
            {latest.steps !== null ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Footprints className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">
                  {latest.steps.toLocaleString()} 歩
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {latest.city && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {latest.city}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
