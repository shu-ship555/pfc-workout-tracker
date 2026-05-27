import { PFC_KEYS, PFC_LABELS, type PFCValues } from "@/lib/types";
import { PFC_COLORS } from "@/lib/color-constants";

/**
 * PFC・カロリーをコンパクトな4列グリッドで表示するコンポーネント。
 * MealForm のプレビュー表示など小スペース向け。
 */
export function PFCGrid({ kcal, protein, fat, carb }: PFCValues) {
  const values: PFCValues = { kcal, protein, fat, carb };

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {PFC_KEYS.map((key) => {
        const value = values[key];
        return (
          <div key={key} className={`rounded-md px-2 pt-1 pb-1.5 ${PFC_COLORS[key]}`}>
            <p className="text-[10px] opacity-70">{PFC_LABELS[key]}</p>
            <p className="text-sm font-bold font-mono leading-tight">
              {value % 1 === 0 ? value : value.toFixed(1)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
