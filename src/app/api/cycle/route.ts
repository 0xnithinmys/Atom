import { NextResponse } from "next/server";
import { getActiveCycle } from "@/lib/cycle";

export async function GET() {
  const active = await getActiveCycle();
  return NextResponse.json(active);
}
