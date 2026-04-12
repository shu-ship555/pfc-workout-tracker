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
