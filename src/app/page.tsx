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
import type { WorkoutEntry, WorkoutFormData, MealEntry, LifeLogEntry } from "@/lib/types";
import { Plus, Dumbbell, Utensils, FlaskConical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [lifeLogs, setLifeLogs] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [listDisplay, setListDisplay] = useState<{ label: string; count: number } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pendingFormData, setPendingFormData] = useState<WorkoutFormData | null>(null);
  const [addedCount, setAddedCount] = useState(0);

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

  function handleContinue(data: WorkoutFormData) {
    setPendingFormData(data);
    setFormKey((k) => k + 1);
    setAddedCount((c) => c + 1);
    setOpen(true);
  }

  function handleWorkoutOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setPendingFormData(null);
      setFormKey((k) => k + 1);
      setAddedCount(0);
    }
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

  function handleMealUpdate(meal: MealEntry) {
    setMeals((prev) => prev.map((m) => (m.id === meal.id ? meal : m)));
  }

  return (
    <div className="flex flex-col min-h-screen">
      {IS_DEMO && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs py-1.5 leading-snug">
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            デモモード — 表示データはサンプルです。変更はページ再読み込みでリセットされます。
          </div>
        </div>
      )}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">PFC Workout Tracker</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Dialog open={mealOpen} onOpenChange={setMealOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" className="h-auto pt-1 pb-1.5" />}>
                <Utensils className="h-4 w-4 mr-1" />
                食事を追加
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg flex flex-col max-h-[90dvh]">
                <DialogHeader>
                  <DialogTitle>食事を記録</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 min-h-0">
                  <MealForm
                    onSuccess={handleMealAdd}
                    onCancel={() => setMealOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={handleWorkoutOpenChange}>
              <DialogTrigger render={<Button size="sm" className="h-auto pt-1 pb-1.5 hover:bg-primary/80" />}>
                <Plus className="h-4 w-4 mr-1" />
                筋トレを追加
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>新しい記録を追加</DialogTitle>
                </DialogHeader>
                <WorkoutForm
                  key={formKey}
                  initialData={pendingFormData ?? undefined}
                  addedCount={addedCount}
                  onSuccess={handleAdd}
                  onContinue={handleContinue}
                  onCancel={() => handleWorkoutOpenChange(false)}
                />
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
        <div className="hidden sm:flex flex-col items-stretch gap-2">
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
        <PFCSummary meals={meals} lifeLogs={lifeLogs} loading={loading} onMealDelete={handleMealDelete} onMealUpdate={handleMealUpdate} />

        <Separator className="mt-10 mb-12" />

        <LifeLogSummary logs={lifeLogs} loading={loading} onRefresh={fetchLifeLogs} />

        <Separator className="mt-10 mb-12" />

        <WorkoutChart workouts={workouts} />

        <div className="flex items-center justify-between">
          {loading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <h2 className="text-sm font-medium">筋トレ記録</h2>
          )}
          {loading ? (
            <Skeleton className="h-4 w-36" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {listDisplay ? (
                <>{listDisplay.label} <span className="text-foreground/40 mx-0.5">|</span> {listDisplay.count} / {workouts.length} 件</>
              ) : (
                <>{workouts.length} 件</>
              )}
            </p>
          )}
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
