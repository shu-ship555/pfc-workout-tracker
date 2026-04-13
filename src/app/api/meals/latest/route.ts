import { NextResponse } from "next/server";
import { deleteLatestMeal } from "@/lib/notion";
import { apiError } from "@/lib/api-utils";

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
    return apiError(e);
  }
}
