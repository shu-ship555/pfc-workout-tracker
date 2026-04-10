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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutForm } from "@/components/workout-form";
import { WorkoutList } from "@/components/workout-list";
import { PFCSummary } from "@/components/pfc-summary";
import type { WorkoutEntry } from "@/lib/types";
import { Plus, Dumbbell } from "lucide-react";

export default function Home() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/workouts")
      .then((r) => r.json())
      .then((data: WorkoutEntry[]) => setWorkouts(data))
      .finally(() => setLoading(false));
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
      {/* Header */}
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

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {/* PFC summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <PFCSummary workouts={workouts} date={today} />
          <PFCSummary workouts={workouts} />
        </div>

        <Separator />

        {/* Workout list tabs */}
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="today">今日</TabsTrigger>
            </TabsList>
            <p className="text-xs text-muted-foreground">
              {workouts.length} 件の記録
            </p>
          </div>

          <TabsContent value="all" className="mt-4">
            <WorkoutList
              workouts={workouts}
              loading={loading}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="today" className="mt-4">
            <WorkoutList
              workouts={workouts.filter((w) => w.date === today)}
              loading={loading}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-3 text-xs text-muted-foreground text-center">
          Powered by Next.js + Notion + Vercel
        </div>
      </footer>
    </div>
  );
}
