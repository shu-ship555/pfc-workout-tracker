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

export type LifeLogEntry = {
  id: string;
  date: string; // "YYYY/MM/DD"
  mood: number | null;
  sleepTime: string;
  wakeTime: string;
  weather: string;
  tempMax: number | null;
  tempMin: number | null;
  humidity: number | null;
  steps: number | null;
  city: string;
  consumedKcal: number | null;
  moodSelect: string; // 気分セレクト値
};

export type MealEntry = {
  id: string;
  date: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
};
