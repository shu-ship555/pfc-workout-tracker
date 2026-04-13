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
import { MealForm } from "@/components/meal-form";
import type { WorkoutEntry, MealEntry, LifeLogEntry } from "@/lib/types";
import { Plus, Dumbbell, Utensils } from "lucide-react";

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [lifeLogs, setLifeLogs] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [listDisplay, setListDisplay] = useState<{ label: string; count: number } | null>(null);

  async function fetchLifeLogs() {
    const data: LifeLogEntry[] = await fetch("/api/lifelog").then((r) => r.ok ? r.json() : []);
    setLifeLogs(data);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts").then((r) => r.json()) as Promise<WorkoutEntry[]>,
      fetch("/api/meals").then((r) => r.json()) as Promise<MealEntry[]>,
      fetch("/api/lifelog").then((r): Promise<LifeLogEntry[]> => r.ok ? r.json() : Promise.resolve([])),
    ]).then(([workoutData, mealData, lifeLogData]) => {
      setWorkouts(workoutData);
      setMeals(mealData);
      setLifeLogs(lifeLogData);
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

  function handleMealAdd(meal: MealEntry) {
    setMeals((prev) => [meal, ...prev]);
    setMealOpen(false);
  }

  function handleMealDelete(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">PFC Workout Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={mealOpen} onOpenChange={setMealOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" className="h-auto pt-1 pb-1.5" />}>
                <Utensils className="h-4 w-4 mr-1" />
                食事を追加
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>食事を記録</DialogTitle>
                </DialogHeader>
                <MealForm
                  onSuccess={handleMealAdd}
                  onMealDelete={handleMealDelete}
                  onCancel={() => setMealOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button size="sm" className="h-auto pt-1 pb-1.5 hover:bg-primary/80" />}>
                <Plus className="h-4 w-4 mr-1" />
                筋トレを追加
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>新しい記録を追加</DialogTitle>
                </DialogHeader>
                <WorkoutForm onSuccess={handleAdd} onCancel={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* SP: 画面下部固定バー / PC: 右下FAB */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
        <div className="sm:hidden border-t bg-card px-4 pt-3 pb-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full h-auto pt-2 pb-3"
            onClick={() => setMealOpen(true)}
          >
            <Utensils className="h-4 w-4 mr-1" />
            食事を追加
          </Button>
          <Button
            className="w-full h-auto pt-2 pb-3 hover:bg-primary/80"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            筋トレを追加
          </Button>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2">
          <Button
            size="lg"
            variant="outline"
            className="flex items-center gap-1 shadow-lg rounded-lg h-auto px-6 pt-1.5 pb-2.5 hover:shadow-xl hover:scale-105"
            onClick={() => setMealOpen(true)}
          >
            <Utensils className="h-5 w-5" />
            食事を追加
          </Button>
          <Button
            size="lg"
            className="flex items-center gap-1 shadow-lg rounded-lg h-auto px-6 pt-1.5 pb-2.5 hover:bg-primary/80 hover:shadow-xl hover:scale-105"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-5 w-5" />
            筋トレを追加
          </Button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-5 pb-24 sm:pb-6 space-y-6">
        <PFCSummary meals={meals} lifeLogs={lifeLogs} />

        <Separator className="mt-10 mb-12" />

        <LifeLogSummary logs={lifeLogs} onRefresh={fetchLifeLogs} />

        <Separator className="mt-10 mb-12" />

        <WorkoutChart workouts={workouts} />

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">筋トレ記録</h2>
          <p className="text-xs text-muted-foreground">
            {listDisplay ? (
              <>{listDisplay.label} <span className="text-foreground/40 mx-0.5">|</span> {listDisplay.count} / {workouts.length} 件</>
            ) : (
              <>{workouts.length} 件</>
            )}
          </p>
        </div>

        <WorkoutList
          workouts={workouts}
          loading={loading}
          paginate
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDisplayChange={setListDisplay}
        />
      </main>
    </div>
  );
}
