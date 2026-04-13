import { NextResponse } from "next/server";
import { deleteLatestMeal } from "@/lib/notion";

export async function DELETE() {
  try {
    const result = await deleteLatestMeal();
    if (!result) {
      return NextResponse.json(
        { error: "削除できるデータが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
