"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkoutEntry, WorkoutFormData } from "@/lib/types";
import { PARTS, EXERCISES, type Part } from "@/lib/exercises";

type Props = {
  initial?: WorkoutEntry;
  onSuccess: (entry: WorkoutEntry) => void;
  onCancel?: () => void;
};

const defaultForm: WorkoutFormData = {
  parts: "",
  exercise: "",
  set: 3,
  rep: 10,
  weight: 0,
  goal: 0,
  memo: "",
  negative: false,
  warmup: false,
  hasRebound: false,
  notStable: false,
};

export function WorkoutForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<WorkoutFormData>(() => {
    if (!initial) return defaultForm;
    const { id: _id, created: _created, ...rest } = initial;
    return rest;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof WorkoutFormData>(key: K, value: WorkoutFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handlePartsChange(value: string | null) {
    setForm((prev) => ({ ...prev, parts: value ?? "", exercise: "" }));
  }

  const exercises = form.parts && form.parts in EXERCISES
    ? EXERCISES[form.parts as Part]
    : [];

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = initial ? `/api/workouts/${initial.id}` : "/api/workouts";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to save (${res.status})`);
      }
      const entry: WorkoutEntry = await res.json();
      onSuccess(entry);
    } catch (e: any) {
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 部位・種目 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>部位</Label>
            <Select value={form.parts} onValueChange={handlePartsChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PARTS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>種目</Label>
            <Select
              value={form.exercise}
              onValueChange={(v) => setField("exercise", v ?? "")}
              disabled={!form.parts}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={form.parts ? "選択してください" : "部位を先に選択"} />
              </SelectTrigger>
              <SelectContent className="min-w-max">
                {exercises.map((ex) => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* セット・レップ・重量・目標 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="set">セット</Label>
            <Input
              id="set"
              type="number"
              min={1}
              value={form.set}
              onChange={(e) => setField("set", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep">レップ</Label>
            <Input
              id="rep"
              type="number"
              min={1}
              value={form.rep}
              onChange={(e) => setField("rep", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weight">重量 (kg)</Label>
            <Input
              id="weight"
              type="number"
              min={0}
              step={0.5}
              value={form.weight || ""}
              onChange={(e) => setField("weight", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="goal">目標 (kg)</Label>
            <Input
              id="goal"
              type="number"
              min={0}
              step={0.5}
              value={form.goal || ""}
              onChange={(e) => setField("goal", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="memo">メモ</Label>
          <Input
            id="memo"
            placeholder="任意のメモ"
            value={form.memo}
            onChange={(e) => setField("memo", e.target.value)}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: "warmup", label: "ウォームアップ" },
              { key: "negative", label: "ネガティブ" },
              { key: "hasRebound", label: "反動有り" },
              { key: "notStable", label: "静止できていない" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setField(key, e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {label}
            </label>
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={loading || !form.exercise}>
            {loading ? "保存中..." : initial ? "更新" : "追加"}
          </Button>
        </div>
      </div>
    </form>
  );
}
