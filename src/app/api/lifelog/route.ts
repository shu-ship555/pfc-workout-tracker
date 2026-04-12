import { NextResponse } from "next/server";
import { listLifeLogs } from "@/lib/notion";

export async function GET() {
  const logs = await listLifeLogs();
  return NextResponse.json(logs);
}
