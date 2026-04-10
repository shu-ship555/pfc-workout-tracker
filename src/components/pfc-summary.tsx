import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkoutEntry } from "@/lib/types";

type Props = {
  workouts: WorkoutEntry[];
  date?: string;
};

export function PFCSummary({ workouts, date }: Props) {
  const filtered = date
    ? workouts.filter((w) => w.date === date)
    : workouts;

  const protein = filtered.reduce((s, w) => s + w.protein, 0);
  const fat = filtered.reduce((s, w) => s + w.fat, 0);
  const carbs = filtered.reduce((s, w) => s + w.carbs, 0);
  const calories = Math.round(protein * 4 + fat * 9 + carbs * 4);

  const items = [
    { label: "P タンパク質", value: protein, unit: "g", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "F 脂質", value: fat, unit: "g", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
    { label: "C 炭水化物", value: carbs, unit: "g", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "カロリー", value: calories, unit: "kcal", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {date ? `${date} の栄養サマリー` : "合計栄養サマリー"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-3 py-2 ${item.color}`}
            >
              <p className="text-xs font-medium opacity-70">{item.label}</p>
              <p className="text-xl font-bold font-mono">
                {item.value.toFixed(item.unit === "kcal" ? 0 : 1)}
                <span className="text-xs font-normal ml-0.5">{item.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
