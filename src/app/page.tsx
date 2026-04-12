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
import { WorkoutChart } from "@/components/workout-chart";
import { PFCSummary } from "@/components/pfc-summary";
import { LifeLogSummary } from "@/components/lifelog-summary";
import type { WorkoutEntry, MealEntry, LifeLogEntry } from "@/lib/types";
import { Plus, Dumbbell } from "lucide-react";

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [lifeLogs, setLifeLogs] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts").then((r) => r.json()),
      fetch("/api/meals").then((r) => r.json()),
      fetch("/api/lifelog").then((r) => r.ok ? r.json() : []),
    ]).then(([workoutData, mealData, lifeLogData]: [WorkoutEntry[], MealEntry[], LifeLogEntry[]]) => {
      setWorkouts(workoutData);
      setMeals(mealData);
      setLifeLogs(lifeLogData);
    }).finally(() => setLoading(false));
  }, []);

  async function refreshLifeLogs() {
    const data: LifeLogEntry[] = await fetch("/api/lifelog").then((r) => r.ok ? r.json() : []);
    setLifeLogs(data);
  }

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
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">PFC Workout Tracker</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="h-auto pt-1 pb-1.5 hover:bg-primary/80" />}>
              <Plus className="h-4 w-4 mr-1" />
              記録を追加
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>新しい記録を追加</DialogTitle>
              </DialogHeader>
              <WorkoutForm onSuccess={handleAdd} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* SP: 画面下部固定バー / PC: 右下FAB */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
        <div className="sm:hidden border-t bg-card px-4 pt-2 pb-3">
          <Button className="w-full h-auto pt-1 pb-2 hover:bg-primary/80" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            記録を追加
          </Button>
        </div>
        <Button
          size="lg"
          className="hidden sm:flex items-center gap-1 shadow-lg rounded-full h-auto px-6 pt-1.5 pb-2.5 hover:bg-primary/80 hover:shadow-xl hover:scale-105"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-5 w-5" />
          記録を追加
        </Button>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-5 pb-24 sm:pb-6 space-y-6">
        <PFCSummary meals={meals} lifeLogs={lifeLogs} />

        <Separator className="mt-10 mb-12" />

        <LifeLogSummary logs={lifeLogs} onRefresh={refreshLifeLogs} />

        <Separator className="mt-10 mb-12" />

        <WorkoutChart workouts={workouts} />

        <Separator className="mt-10 mb-12" />

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
