import { PFC_COLORS } from "@/lib/color-constants";

type Props = {
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
};

const ITEMS = [
  { key: "kcal"    as const, label: "kcal" },
  { key: "protein" as const, label: "P" },
  { key: "fat"     as const, label: "F" },
  { key: "carb"    as const, label: "C" },
] satisfies { key: keyof Props; label: string }[];

const COLOR_MAP: Record<keyof Props, string> = {
  kcal:    PFC_COLORS.kcal,
  protein: PFC_COLORS.protein,
  fat:     PFC_COLORS.fat,
  carb:    PFC_COLORS.carb,
};

/**
 * PFC・カロリーをコンパクトな4列グリッドで表示するコンポーネント。
 * MealForm のプレビュー表示など小スペース向け。
 */
export function PFCGrid({ kcal, protein, fat, carb }: Props) {
  const values: Props = { kcal, protein, fat, carb };

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {ITEMS.map(({ key, label }) => {
        const value = values[key];
        return (
          <div key={key} className={`rounded-md px-2 pt-1 pb-1.5 ${COLOR_MAP[key]}`}>
            <p className="text-[10px] opacity-70">{label}</p>
            <p className="text-sm font-bold font-mono leading-tight">
              {value % 1 === 0 ? value : value.toFixed(1)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
