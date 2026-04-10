"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { WorkoutEntry, WorkoutFormData } from "@/lib/types";

type Props = {
  initial?: WorkoutEntry;
  onSuccess: (entry: WorkoutEntry) => void;
  onCancel?: () => void;
};

const defaultForm: WorkoutFormData = {
  date: new Date().toISOString().split("T")[0],
  exercise: "",
  sets: 3,
  reps: 10,
  weight: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  notes: "",
};

export function WorkoutForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<WorkoutFormData>(
    initial ? { ...initial } : defaultForm
  );
  const [loading, setLoading] = useState(false);

  const set = (key: keyof WorkoutFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initial
        ? `/api/workouts/${initial.id}`
        : "/api/workouts";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      const entry: WorkoutEntry = await res.json();
      onSuccess(entry);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="exercise">種目</Label>
            <Input
              id="exercise"
              placeholder="例: ベンチプレス"
              value={form.exercise}
              onChange={(e) => set("exercise", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="sets">セット数</Label>
            <Input
              id="sets"
              type="number"
              min={1}
              value={form.sets}
              onChange={(e) => set("sets", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reps">レップ数</Label>
            <Input
              id="reps"
              type="number"
              min={1}
              value={form.reps}
              onChange={(e) => set("reps", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weight">重量 (kg)</Label>
            <Input
              id="weight"
              type="number"
              min={0}
              step={0.5}
              value={form.weight}
              onChange={(e) => set("weight", Number(e.target.value))}
            />
          </div>
        </div>

        <Separator />

        <p className="text-sm font-medium text-muted-foreground">栄養摂取量</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="protein">P タンパク質 (g)</Label>
            <Input
              id="protein"
              type="number"
              min={0}
              step={0.1}
              value={form.protein}
              onChange={(e) => set("protein", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fat">F 脂質 (g)</Label>
            <Input
              id="fat"
              type="number"
              min={0}
              step={0.1}
              value={form.fat}
              onChange={(e) => set("fat", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="carbs">C 炭水化物 (g)</Label>
            <Input
              id="carbs"
              type="number"
              min={0}
              step={0.1}
              value={form.carbs}
              onChange={(e) => set("carbs", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes">メモ</Label>
          <Input
            id="notes"
            placeholder="任意のメモ"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : initial ? "更新" : "追加"}
          </Button>
        </div>
      </div>
    </form>
  );
}
