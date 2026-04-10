import { Client } from "@notionhq/client";
import type { WorkoutEntry, WorkoutFormData } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_WORKOUT_DATABASE_ID!;

function pageToWorkout(page: any): WorkoutEntry {
  const props = page.properties;
  return {
    id: page.id,
    date: props.Date?.date?.start ?? "",
    exercise: props.Exercise?.title?.[0]?.plain_text ?? "",
    sets: props.Sets?.number ?? 0,
    reps: props.Reps?.number ?? 0,
    weight: props.Weight?.number ?? 0,
    protein: props.Protein?.number ?? 0,
    fat: props.Fat?.number ?? 0,
    carbs: props.Carbs?.number ?? 0,
    notes: props.Notes?.rich_text?.[0]?.plain_text ?? "",
  };
}

export async function listWorkouts(): Promise<WorkoutEntry[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ property: "Date", direction: "descending" }],
  });
  return response.results.map(pageToWorkout);
}

export async function createWorkout(data: WorkoutFormData): Promise<WorkoutEntry> {
  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Exercise: { title: [{ text: { content: data.exercise } }] },
      Date: { date: { start: data.date } },
      Sets: { number: data.sets },
      Reps: { number: data.reps },
      Weight: { number: data.weight },
      Protein: { number: data.protein },
      Fat: { number: data.fat },
      Carbs: { number: data.carbs },
      Notes: { rich_text: [{ text: { content: data.notes } }] },
    },
  });
  return pageToWorkout(page);
}

export async function updateWorkout(id: string, data: WorkoutFormData): Promise<WorkoutEntry> {
  const page = await notion.pages.update({
    page_id: id,
    properties: {
      Exercise: { title: [{ text: { content: data.exercise } }] },
      Date: { date: { start: data.date } },
      Sets: { number: data.sets },
      Reps: { number: data.reps },
      Weight: { number: data.weight },
      Protein: { number: data.protein },
      Fat: { number: data.fat },
      Carbs: { number: data.carbs },
      Notes: { rich_text: [{ text: { content: data.notes } }] },
    },
  });
  return pageToWorkout(page);
}

export async function deleteWorkout(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}
