"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PARTS, EXERCISES, type Part } from "@/lib/exercises";

// ─── PartSelect ───────────────────────────────────────────────────────────────

type PartSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** "すべて" オプションを先頭に追加するか */
  includeAll?: boolean;
  /** SelectTrigger の className */
  triggerClassName?: string;
  placeholder?: string;
};

export function PartSelect({
  value,
  onValueChange,
  includeAll = false,
  triggerClassName = "w-full",
  placeholder = "選択してください",
}: PartSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {includeAll && (
          <SelectItem value="すべて" className="text-xs">すべて</SelectItem>
        )}
        {PARTS.map((p) => (
          <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── ExerciseSelect ───────────────────────────────────────────────────────────

type ExerciseSelectProps = {
  value: string;
  /** 種目リストの絞り込みに使う部位 */
  part: string;
  onValueChange: (value: string) => void;
  /** "すべて" オプションを先頭に追加するか */
  includeAll?: boolean;
  disabled?: boolean;
  /** SelectTrigger の className */
  triggerClassName?: string;
  placeholder?: string;
};

export function ExerciseSelect({
  value,
  part,
  onValueChange,
  includeAll = false,
  disabled = false,
  triggerClassName = "w-full",
  placeholder = "選択してください",
}: ExerciseSelectProps) {
  const exercises = part && part in EXERCISES ? EXERCISES[part as Part] ?? [] : [];

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="min-w-max" alignItemWithTrigger={false}>
        {includeAll && (
          <SelectItem value="すべて" className="text-xs">すべて</SelectItem>
        )}
        {exercises.map((ex) => (
          <SelectItem key={ex} value={ex} className="text-xs">{ex}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
