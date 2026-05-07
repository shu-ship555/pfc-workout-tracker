"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { WorkoutForm } from "@/components/workout-form";
import { WorkoutList } from "@/components/workout-list";
import { WorkoutChart } from "@/components/workout-chart";
import { PFCSummary } from "@/components/pfc-summary";
import { LifeLogSummary } from "@/components/lifelog-summary";
import { MealForm } from "@/components/meal-form";
import { ActionButtons } from "@/components/action-buttons";
import { DietCalendar } from "@/components/diet-calendar";
import type { WorkoutEntry, WorkoutFormData, MealEntry, LifeLogEntry, DietGoal } from "@/lib/types";

type InitData = { workouts: WorkoutEntry[]; meals: MealEntry[]; dietGoal: DietGoal };
import { DEMO_BANNER } from "@/lib/color-constants";
import { Dumbbell, FlaskConical, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { apiGet, apiPost } from "@/lib/api-client";
import { calcDietProgress } from "@/lib/diet";
import { useCrudList } from "@/hooks/use-crud-list";
import { normalizeDate } from "@/lib/date-utils";
import { SpeedInsights } from "@vercel/speed-insights/next"

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const FEATURES = {
  LIFELOG: true,
  FITBIT_REAUTH: true,
} as const;

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const { items: workouts, setItems: setWorkouts, add: addWorkout, update: updateWorkout, remove: removeWorkout } = useCrudList<WorkoutEntry>();
  const { items: meals, setItems: setMeals, add: addMeal, update: updateMeal, remove: removeMeal } = useCrudList<MealEntry>();
  const [lifeLogs, setLifeLogs] = useState<LifeLogEntry[]>([]);
  const [lifeLogLoading, setLifeLogLoading] = useState(true);
  const { data: initData, isLoading: loading, mutate: mutateInit } = useSWR<InitData>("/api/init", apiGet);
  const [open, setOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authSecret, setAuthSecret] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [pendingFormData, setPendingFormData] = useState<WorkoutFormData | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [dietGoal, setDietGoal] = useState<DietGoal>({ type: "lose", targetKg: 3, startDate: "", endDate: "" });
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [dietSettingsOpen, setDietSettingsOpen] = useState(false);
  const [draftGoal, setDraftGoal] = useState<DietGoal>({ type: "lose", targetKg: 3, startDate: "", endDate: "" });
  const [savingDietGoal, setSavingDietGoal] = useState(false);
  const [dietCalendarVisible, setDietCalendarVisible] = useState(() => {
    try { return localStorage.getItem("diet-calendar-visible") !== "false"; } catch { return true; }
  });

  useEffect(() => {
    if (!initData) return;
    if (!allDataLoaded) {
      setWorkouts(initData.workouts);
      setMeals(initData.meals);
    }
    setDietGoal(initData.dietGoal);
  }, [initData, allDataLoaded, setWorkouts, setMeals]);

  function openDietSettings() {
    setDraftGoal(dietGoal);
    setMenuOpen(false);
    setDietSettingsOpen(true);
  }

  async function saveDietGoal() {
    setSavingDietGoal(true);
    try {
      await apiPost<DietGoal>("/api/diet-goal", draftGoal);
      setDietGoal(draftGoal);
      setDietSettingsOpen(false);
      mutateInit();
    } finally {
      setSavingDietGoal(false);
    }
  }

  async function fetchLifeLogs() {
    const data = await apiGet<LifeLogEntry[]>("/api/lifelog");
    setLifeLogs(data);
  }

  async function loadAllData() {
    const data = await apiGet<InitData>("/api/init?since=");
    setWorkouts(data.workouts);
    setMeals(data.meals);
    setAllDataLoaded(true);
  }

  useEffect(() => {
    if (!FEATURES.LIFELOG) {
      setLifeLogLoading(false);
      return;
    }
    fetch("/api/daily-summary").then(async (res) => {
      if (FEATURES.FITBIT_REAUTH && res.headers.get("x-fitbit-auth-error") === "1") {
        appToast.error("Fitbit の再認証が必要です", {
          description: "リフレッシュトークンが無効になっています",
        });
      }
      const data = res.ok ? await (res.json() as Promise<LifeLogEntry[]>) : [];
      setLifeLogs(data);
      const today = data[0];
      if (today && !today.moodSelect && new Date().getHours() >= 22) {
        appToast.info("気分が未入力です", {
          description: "ライフログから今日の気分を記録しましょう",
          duration: 4000,
        });
      }
    }).catch(() => {}).finally(() => setLifeLogLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!dietGoal.startDate || !dietGoal.endDate || !dietGoal.targetKg) return;

    const jstNow = new Date(Date.now() + 9 * 3600_000);
    if (jstNow.getUTCHours() < 20) return;

    const todayStr = jstNow.toISOString().slice(0, 10);

    const todayIntake = meals
      .filter((m) => normalizeDate(m.date) === todayStr)
      .reduce((s, m) => s + m.kcal, 0);
    const todayConsumed = lifeLogs.find((l) => normalizeDate(l.date) === todayStr)?.consumedKcal ?? null;
    if (todayConsumed === null) return;

    const { dailyTarget } = calcDietProgress(dietGoal, meals, lifeLogs, todayStr);
    if (dailyTarget === null) return;
    const balance = todayIntake - todayConsumed;

    let shouldWarn = false;
    if (dietGoal.type === "lose" && balance > -dailyTarget) shouldWarn = true;
    if (dietGoal.type === "gain" && balance < dailyTarget) shouldWarn = true;

    if (shouldWarn) {
      const title = dietGoal.type === "lose" ? "消費カロリーが足りていません" : "摂取カロリーが足りていません";
      const sign = dietGoal.type === "lose" ? "-" : "+";
      appToast.warning(title, {
        description: `今日の目標収支 ${sign}${dailyTarget.toLocaleString()}kcal に達していません`,
      });
    }
  }, [loading, meals, lifeLogs, dietGoal]);

  function handleAdd(entry: WorkoutEntry) {
    addWorkout(entry);
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

  function handleMealAdd(meal: MealEntry) {
    addMeal(meal);
    setMealOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {IS_DEMO && (
        <div className={`${DEMO_BANNER.bg} border-b ${DEMO_BANNER.border} ${DEMO_BANNER.text} text-xs py-1.5 leading-snug`}>
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            デモモード — 表示データはサンプルです。変更はページ再読み込みでリセットされます。
          </div>
        </div>
      )}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight">PFC Workout Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="ダークモード切り替え"
              />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Dialog open={mealOpen} onOpenChange={setMealOpen}>
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
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button size="icon" variant="ghost" className="h-10 w-10 sm:h-8 sm:w-8" aria-label="メニュー" />
                }
              >
                <Menu className="h-5 w-5 sm:h-4 sm:w-4" />
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>メニュー</SheetTitle>
                </SheetHeader>
                <div className="px-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={openDietSettings}
                  >
                    ダイエット目標設定
                  </Button>
                  {FEATURES.FITBIT_REAUTH && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setMenuOpen(false);
                        setAuthOpen(true);
                      }}
                    >
                      Fitbit 再認証
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            {FEATURES.FITBIT_REAUTH && (
              <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fitbit 再認証</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const authWindow = window.open(
                        `/api/fitbit/auth?secret=${encodeURIComponent(authSecret)}`,
                        "_blank",
                      );
                      setAuthOpen(false);
                      setAuthSecret("");
                      if (authWindow) {
                        const handleMessage = (event: MessageEvent) => {
                          if (event.data?.type === "fitbit-auth-complete") {
                            window.removeEventListener("message", handleMessage);
                            location.reload();
                          }
                        };
                        window.addEventListener("message", handleMessage);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fitbit-auth-secret">シークレット</Label>
                      <Input
                        id="fitbit-auth-secret"
                        type="password"
                        value={authSecret}
                        onChange={(e) => setAuthSecret(e.target.value)}
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        FITBIT_AUTH_SECRET を入力してください
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setAuthOpen(false)}>
                        キャンセル
                      </Button>
                      <Button type="submit" disabled={!authSecret}>
                        認証ページを開く
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={dietSettingsOpen} onOpenChange={setDietSettingsOpen}>
              <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>ダイエット目標設定</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="diet-calendar-visible">カレンダーを表示</Label>
                    <Switch
                      id="diet-calendar-visible"
                      checked={dietCalendarVisible}
                      onCheckedChange={(v) => {
                        setDietCalendarVisible(v);
                        try { localStorage.setItem("diet-calendar-visible", String(v)); } catch { }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>目標タイプ</Label>
                    <div className="flex rounded-md border overflow-hidden">
                      <Button
                        type="button"
                        variant={draftGoal.type === "lose" ? "default" : "ghost"}
                        className="flex-1 rounded-none"
                        onClick={() => setDraftGoal((g) => ({ ...g, type: "lose" }))}
                      >
                        減量
                      </Button>
                      <Button
                        type="button"
                        variant={draftGoal.type === "gain" ? "default" : "ghost"}
                        className="flex-1 rounded-none"
                        onClick={() => setDraftGoal((g) => ({ ...g, type: "gain" }))}
                      >
                        増量
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet-target-kg">目標体重変化</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="diet-target-kg"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={draftGoal.targetKg}
                        onChange={(e) => setDraftGoal((g) => ({ ...g, targetKg: parseFloat(e.target.value) || 0 }))}
                        className="w-28"
                      />
                      <span className="text-sm text-muted-foreground">kg</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1kg = 7,500 kcal で計算します
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="diet-start-date">開始日</Label>
                      <Input
                        id="diet-start-date"
                        type="date"
                        value={draftGoal.startDate}
                        onChange={(e) => setDraftGoal((g) => ({ ...g, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diet-end-date">終了日</Label>
                      <Input
                        id="diet-end-date"
                        type="date"
                        value={draftGoal.endDate}
                        onChange={(e) => setDraftGoal((g) => ({ ...g, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDietSettingsOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={saveDietGoal} disabled={savingDietGoal || draftGoal.targetKg <= 0}>
                      {savingDietGoal ? "保存中…" : "保存"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <ActionButtons onMealOpen={() => setMealOpen(true)} onWorkoutOpen={() => setOpen(true)} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-5 pb-24 sm:pb-6 space-y-6">
        <PFCSummary meals={meals} lifeLogs={lifeLogs} loading={loading} onMealDelete={removeMeal} onMealUpdate={updateMeal} dietGoal={dietGoal} />

        {dietCalendarVisible && <DietCalendar meals={meals} lifeLogs={lifeLogs} goal={dietGoal} loading={loading} onSettingsOpen={openDietSettings} onMealAdd={addMeal} />}

        {FEATURES.LIFELOG && (
          <>
            <Separator className="mt-10 mb-12" />
            <LifeLogSummary logs={lifeLogs} loading={lifeLogLoading} onRefresh={fetchLifeLogs} />
            <Separator className="mt-10 mb-12" />
          </>
        )}

        <WorkoutChart workouts={workouts} />

        <div className="mt-4!">
          <WorkoutList
            workouts={workouts}
            loading={loading}
            paginate
            hasFullHistory={allDataLoaded}
            onLoadAll={loadAllData}
            onUpdate={updateWorkout}
            onDelete={removeWorkout}
          />
        </div>
        <SpeedInsights />
      </main>
    </div>
  );
}
