import { Input } from "@/components/ui/input";
import { PFC_KEYS, PFC_INPUT_LABELS, type PFCValues } from "@/lib/types";

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
      {PFC_KEYS.map((key) => (
        <div key={key} className="space-y-0.5">
          <p className={labelClassName}>{PFC_INPUT_LABELS[key]}</p>
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
