import { Client } from "@notionhq/client";
import type { WorkoutEntry, WorkoutFormData, MealEntry } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const WORKOUT_DB = process.env.NOTION_WORKOUT_DATABASE_ID!;
const FOOD_DB = process.env.NOTION_FOOD_DATABASE_ID!;

// --- Workout DB ---

function pageToWorkout(page: any): WorkoutEntry {
  const props = page.properties;
  return {
    id: page.id,
    created: page.created_time,
    parts: props.parts?.select?.name ?? "",
    exercise: props.exercise?.select?.name ?? "",
    set: props.set?.number ?? 0,
    rep: props.rep?.number ?? 0,
    weight: props.weight?.number ?? 0,
    goal: props.Goal?.number ?? 0,
    memo: props["メモ"]?.title?.[0]?.plain_text ?? "",
    negative: props["ネガティブ"]?.checkbox ?? false,
    warmup: props["ウォームアップ"]?.checkbox ?? false,
    hasRebound: props["反動有り"]?.checkbox ?? false,
    notStable: props["静止できていない"]?.checkbox ?? false,
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
      "メモ": { title: [{ text: { content: data.memo } }] },
      parts: { select: data.parts ? { name: data.parts } : null } as any,
      exercise: { select: data.exercise ? { name: data.exercise } : null } as any,
      set: { number: data.set },
      rep: { number: data.rep },
      weight: { number: data.weight },
      Goal: { number: data.goal },
      "ネガティブ": { checkbox: data.negative },
      "ウォームアップ": { checkbox: data.warmup },
      "反動有り": { checkbox: data.hasRebound },
      "静止できていない": { checkbox: data.notStable },
    },
  });
  return pageToWorkout(page);
}

export async function updateWorkout(id: string, data: WorkoutFormData): Promise<WorkoutEntry> {
  const page = await notion.pages.update({
    page_id: id,
    properties: {
      "メモ": { title: [{ text: { content: data.memo } }] },
      parts: { select: data.parts ? { name: data.parts } : null } as any,
      exercise: { select: data.exercise ? { name: data.exercise } : null } as any,
      set: { number: data.set },
      rep: { number: data.rep },
      weight: { number: data.weight },
      Goal: { number: data.goal },
      "ネガティブ": { checkbox: data.negative },
      "ウォームアップ": { checkbox: data.warmup },
      "反動有り": { checkbox: data.hasRebound },
      "静止できていない": { checkbox: data.notStable },
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
