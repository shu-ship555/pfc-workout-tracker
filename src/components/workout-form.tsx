"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { WorkoutEntry, WorkoutFormData } from "@/lib/types";
import { PartSelect, ExerciseSelect } from "@/components/workout-selects";
import { Check } from "lucide-react";
import { apiPost, apiPut, getErrorMessage } from "@/lib/api-client";
import { STATUS_COLORS } from "@/lib/color-constants";

type Props = {
  initial?: WorkoutEntry;
  initialData?: WorkoutFormData;
  addedCount?: number;
  onSuccess: (entry: WorkoutEntry) => void;
  onContinue?: (data: WorkoutFormData) => void;
  onCancel?: () => void;
};

const defaultForm: WorkoutFormData = {
  parts: "",
  exercise: "",
  set: 3,
  rep: 8,
  weight: 0,
  goal: 0,
  memo: "",
  negative: false,
  warmup: false,
  hasRebound: false,
  notStable: false,
};

export function WorkoutForm({ initial, initialData, addedCount, onSuccess, onContinue, onCancel }: Props) {
  const [form, setForm] = useState<WorkoutFormData>(() => {
    if (initial) { const { id: _id, created: _created, ...rest } = initial; return rest; }
    if (initialData) return initialData;
    return defaultForm;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(!!initialData);
  const [setStr, setSetStr] = useState(String(form.set || ""));
  const [repStr, setRepStr] = useState(String(form.rep || ""));
  const [justAdded, setJustAdded] = useState(!!initialData);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(t);
  }, [justAdded]);

  const setField = <K extends keyof WorkoutFormData>(key: K, value: WorkoutFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handlePartsChange(value: string | null) {
    setForm((prev) => ({ ...prev, parts: value ?? "", exercise: "" }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const entry = initial
        ? await apiPut<WorkoutEntry>(`/api/workouts/${initial.id}`, form)
        : await apiPost<WorkoutEntry>("/api/workouts", form);
      onSuccess(entry);
      if (continuousMode) onContinue?.(form);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "保存に失敗しました"));
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
            <PartSelect
              value={form.parts}
              onValueChange={handlePartsChange}
            />
          </div>
          <div className="space-y-1">
            <Label>種目</Label>
            <ExerciseSelect
              value={form.exercise}
              part={form.parts}
              onValueChange={(v) => setField("exercise", v ?? "")}
              disabled={!form.parts}
              placeholder={form.parts ? "選択してください" : "部位を先に選択"}
            />
          </div>
        </div>

        {/* セット・レップ・重量・目標 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="set">セット</Label>
            <Input
              id="set"
              type="number"
              min={1}
              value={setStr}
              onChange={(e) => {
                setSetStr(e.target.value);
                if (e.target.value !== "") setField("set", Number(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep">レップ</Label>
            <Input
              id="rep"
              type="number"
              min={1}
              value={repStr}
              onChange={(e) => {
                setRepStr(e.target.value);
                if (e.target.value !== "") setField("rep", Number(e.target.value));
              }}
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

        {continuousMode && (addedCount ?? 0) > 0 && (
          <div className={`flex items-center gap-1.5 text-xs rounded-md px-3 py-2 transition-colors duration-500 ${
            justAdded
              ? STATUS_COLORS.success
              : "bg-muted/60 text-muted-foreground"
          }`}>
            {justAdded && <Check className="h-3.5 w-3.5 shrink-0" />}
            <span>{justAdded ? "追加しました" : "連続追加中"}</span>
            <span className="ml-auto font-mono font-medium">計 {addedCount} 件</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!initial && (
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-muted-foreground">
              <div className="relative inline-flex h-4 w-7 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                />
                <span className="h-4 w-7 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-background shadow transition-transform peer-checked:translate-x-3" />
              </div>
              連続入力
            </label>
          )}
          <div className="flex gap-2 ml-auto">
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
      </div>
    </form>
  );
}
