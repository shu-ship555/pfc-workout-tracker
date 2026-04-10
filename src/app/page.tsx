"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { WorkoutForm } from "@/components/workout-form";
import { WorkoutList } from "@/components/workout-list";
import { PFCSummary } from "@/components/pfc-summary";
import type { WorkoutEntry, MealEntry } from "@/lib/types";
import { Plus, Dumbbell } from "lucide-react";

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts").then((r) => r.json()),
      fetch("/api/meals").then((r) => r.json()),
    ]).then(([workoutData, mealData]: [WorkoutEntry[], MealEntry[]]) => {
      setWorkouts(workoutData);
      setMeals(mealData);
    }).finally(() => setLoading(false));
  }, []);

  function handleAdd(entry: WorkoutEntry) {
    setWorkouts((prev) => [entry, ...prev]);
    setOpen(false);
  }

  function handleUpdate(entry: WorkoutEntry) {
    setWorkouts((prev) => prev.map((w) => (w.id === entry.id ? entry : w)));
  }

  function handleDelete(id: string) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">PFC Workout Tracker</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" />
              記録を追加
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>新しい記録を追加</DialogTitle>
              </DialogHeader>
              <WorkoutForm onSuccess={handleAdd} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        <PFCSummary meals={meals} />

        <Separator />

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">筋トレ記録</h2>
          <p className="text-xs text-muted-foreground">{workouts.length} 件</p>
        </div>

        <WorkoutList
          workouts={workouts}
          loading={loading}
          paginate
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
