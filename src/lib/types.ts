export type WorkoutEntry = {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  protein: number;
  fat: number;
  carbs: number;
  notes: string;
};

export type PFCSummary = {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
};

export type WorkoutFormData = Omit<WorkoutEntry, "id">;
