import { Client } from "@notionhq/client";
import type { WorkoutEntry, WorkoutFormData, MealEntry, LifeLogEntry } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const WORKOUT_DB = process.env.NOTION_WORKOUT_DATABASE_ID!;
const FOOD_DB = process.env.NOTION_FOOD_DATABASE_ID!;
const LIFELOG_DB = process.env.NOTION_LIFELOG_DATABASE_ID!;

// --- Workout DB ---

function pageToWorkout(page: any): WorkoutEntry {
  const props = page.properties;
  return {
    id: page.id,
    created: page.created_time,
    parts: props.Parts?.select?.name ?? "",
    exercise: props.Exercise?.select?.name ?? "",
    set: props.Set?.number ?? 0,
    rep: props.Rep?.number ?? 0,
    weight: props.Weight?.number ?? 0,
    goal: props.Goal?.number ?? 0,
    memo: props.Memo?.title?.[0]?.plain_text ?? "",
    negative: props.Negative?.checkbox ?? false,
    warmup: props.Warmup?.checkbox ?? false,
    hasRebound: props.hasRebound?.checkbox ?? false,
    notStable: props.notStable?.checkbox ?? false,
  };
}

export async function listWorkouts(): Promise<WorkoutEntry[]> {
  const response = await notion.databases.query({
    database_id: WORKOUT_DB,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return response.results.map(pageToWorkout);
}

export async function createWorkout(data: WorkoutFormData): Promise<WorkoutEntry> {
  const page = await notion.pages.create({
    parent: { database_id: WORKOUT_DB },
    properties: {
      Memo: { title: [{ text: { content: data.memo } }] },
      Parts: { select: data.parts ? { name: data.parts } : null } as any,
      Exercise: { select: data.exercise ? { name: data.exercise } : null } as any,
      Set: { number: data.set },
      Rep: { number: data.rep },
      Weight: { number: data.weight },
      Goal: { number: data.goal },
      Negative: { checkbox: data.negative },
      Warmup: { checkbox: data.warmup },
      hasRebound: { checkbox: data.hasRebound },
      notStable: { checkbox: data.notStable },
    },
  });
  return pageToWorkout(page);
}

export async function updateWorkout(id: string, data: WorkoutFormData): Promise<WorkoutEntry> {
  const page = await notion.pages.update({
    page_id: id,
    properties: {
      Memo: { title: [{ text: { content: data.memo } }] },
      Parts: { select: data.parts ? { name: data.parts } : null } as any,
      Exercise: { select: data.exercise ? { name: data.exercise } : null } as any,
      Set: { number: data.set },
      Rep: { number: data.rep },
      Weight: { number: data.weight },
      Goal: { number: data.goal },
      Negative: { checkbox: data.negative },
      Warmup: { checkbox: data.warmup },
      hasRebound: { checkbox: data.hasRebound },
      notStable: { checkbox: data.notStable },
    },
  });
  return pageToWorkout(page);
}

export async function deleteWorkout(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}

// --- Food DB ---

function pageToMeal(page: any): MealEntry {
  const props = page.properties;
  return {
    id: page.id,
    date: props.Date?.date?.start ?? "",
    name: props.Name?.title?.[0]?.plain_text ?? "",
    kcal: props.Kcal?.number ?? 0,
    protein: props.Protein?.number ?? 0,
    fat: props.Fat?.number ?? 0,
    carb: props.Carb?.number ?? 0,
  };
}

export async function listMeals(): Promise<MealEntry[]> {
  const response = await notion.databases.query({
    database_id: FOOD_DB,
    sorts: [{ property: "Date", direction: "descending" }],
  });
  return response.results.map(pageToMeal);
}

export async function createMeal(data: Omit<MealEntry, "id">): Promise<MealEntry> {
  const page = await notion.pages.create({
    parent: { database_id: FOOD_DB },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      Date: { date: { start: data.date } },
      Kcal: { number: data.kcal },
      Protein: { number: data.protein },
      Fat: { number: data.fat },
      Carb: { number: data.carb },
    },
  });
  return pageToMeal(page);
}

export async function deleteMeal(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}

export async function updateMeal(id: string, data: Omit<MealEntry, "id">): Promise<MealEntry> {
  const page = await notion.pages.update({
    page_id: id,
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      Date: { date: { start: data.date } },
      Kcal: { number: data.kcal },
      Protein: { number: data.protein },
      Fat: { number: data.fat },
      Carb: { number: data.carb },
    },
  });
  return pageToMeal(page);
}

export async function deleteLatestMeal(): Promise<{ id: string; name: string } | null> {
  const response = await notion.databases.query({
    database_id: FOOD_DB,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 1,
  });
  if (response.results.length === 0) return null;
  const page = response.results[0] as any;
  const name = page.properties?.Name?.title?.[0]?.plain_text ?? "不明な料理";
  await notion.pages.update({ page_id: page.id, archived: true });
  return { id: page.id, name };
}

// --- LifeLog DB ---

function pageToLifeLog(page: any): LifeLogEntry {
  const props = page.properties;
  return {
    id: page.id,
    date: props["名前"]?.title?.[0]?.plain_text ?? "",
    mood: props["数値化した気分"]?.formula?.number ?? null,
    sleepTime: props["入眠"]?.rich_text?.[0]?.plain_text ?? "",
    wakeTime: props["起床"]?.rich_text?.[0]?.plain_text ?? "",
    weather: props["天気"]?.rich_text?.[0]?.plain_text ?? "",
    tempMax: props["最高気温"]?.number ?? null,
    tempMin: props["最低気温"]?.number ?? null,
    humidity: props["湿度"]?.number ?? null,
    steps: props["歩数"]?.number ?? null,
    city: props["街"]?.rich_text?.[0]?.plain_text ?? "",
    consumedKcal: props["消費カロリー"]?.number ?? null,
    weight: props["体重"]?.number ?? null,
    moodSelect: props["気分"]?.select?.name ?? "",
  };
}

export async function listLifeLogs(): Promise<LifeLogEntry[]> {
  const response = await notion.databases.query({
    database_id: LIFELOG_DB,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 30,
  });
  return response.results.map(pageToLifeLog);
}

export async function getMoodSelectOptions(): Promise<string[]> {
  const db = await notion.databases.retrieve({ database_id: LIFELOG_DB }) as any;
  const options = db.properties["気分"]?.select?.options ?? [];
  return options.map((o: any) => o.name);
}

export async function updateLifeLogMood(id: string, moodSelect: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      気分: { select: moodSelect ? { name: moodSelect } : null } as any,
    },
  });
}

type LifeLogUpsertData = {
  city: string;
  weather: string;
  tempMax: number | null;
  tempMin: number | null;
  humidity: number | null;
  steps: number | null;
  consumedKcal: number | null;
  sleepHours: number | null;
  sleepTime: string;
  wakeTime: string;
  weight: number | null;
};

/** 今日の日付で Notion lifelog を upsert する（あれば更新、なければ作成） */
export async function upsertTodayLifeLog(data: LifeLogUpsertData): Promise<void> {
  const jstNow = new Date(Date.now() + 9 * 3600_000);
  const todayDisplay = jstNow.toISOString().slice(0, 10).replace(/-/g, "/"); // "YYYY/MM/DD"

  const existing = await notion.databases.query({
    database_id: LIFELOG_DB,
    filter: { property: "名前", title: { equals: todayDisplay } },
  });

  // null や空文字の場合は Notion の既存データを上書きしない
  const sharedProps: Record<string, unknown> = {
    ...(data.weather        && { 天気: { rich_text: [{ text: { content: data.weather } }] } }),
    ...(data.tempMax  != null && { 最高気温: { number: data.tempMax } }),
    ...(data.tempMin  != null && { 最低気温: { number: data.tempMin } }),
    ...(data.humidity != null && { 湿度: { number: data.humidity } }),
    ...(data.city           && { 街: { rich_text: [{ text: { content: data.city } }] } }),
    ...(data.steps    != null && { 歩数: { number: data.steps } }),
    ...(data.consumedKcal != null && { 消費カロリー: { number: data.consumedKcal } }),
    ...(data.sleepHours != null && { 睡眠時間: { number: data.sleepHours } }),
    ...(data.sleepTime      && { 入眠: { rich_text: [{ text: { content: data.sleepTime } }] } }),
    ...(data.wakeTime       && { 起床: { rich_text: [{ text: { content: data.wakeTime } }] } }),
    ...(data.weight   != null && { 体重: { number: data.weight } }),
  };

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties: sharedProps as any,
    });
  } else {
    await notion.pages.create({
      parent: { database_id: LIFELOG_DB },
      properties: {
        名前: { title: [{ text: { content: todayDisplay } }] },
        日付: { date: { start: new Date().toISOString() } },
        ...sharedProps,
      } as any,
    });
  }
}
