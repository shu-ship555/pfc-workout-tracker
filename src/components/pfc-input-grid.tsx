import { Input } from "@/components/ui/input";
import type { PFCValues } from "@/lib/types";

const PFC_FIELDS = [
  { key: "kcal"    as const, label: "kcal" },
  { key: "protein" as const, label: "P(g)" },
  { key: "fat"     as const, label: "F(g)" },
  { key: "carb"    as const, label: "C(g)" },
] satisfies { key: keyof PFCValues; label: string }[];

type Props = {
  values: PFCValues;
  onChange: (key: keyof PFCValues, value: number) => void;
  inputClassName?: string;
  labelClassName?: string;
};

export function PFCInputGrid({
  values,
  onChange,
  inputClassName = "h-8 text-xs px-2",
  labelClassName = "text-xs text-muted-foreground",
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {PFC_FIELDS.map(({ key, label }) => (
        <div key={key} className="space-y-0.5">
          <p className={labelClassName}>{label}</p>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={values[key] || ""}
            onChange={(e) => onChange(key, Number(e.target.value))}
            className={inputClassName}
          />
        </div>
      ))}
    </div>
  );
}
