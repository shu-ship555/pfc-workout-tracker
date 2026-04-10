export type WorkoutEntry = {
  id: string;
  created: string;
  parts: string;
  exercise: string;
  set: number;
  rep: number;
  weight: number;
  goal: number;
  memo: string;
  negative: boolean;
  warmup: boolean;
  hasRebound: boolean;
  notStable: boolean;
};

export type WorkoutFormData = Omit<WorkoutEntry, "id" | "created">;

export type MealEntry = {
  id: string;
  date: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
};
