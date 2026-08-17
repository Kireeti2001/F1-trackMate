import { NextResponse } from "next/server";
import { getDriverStandings, getLastRace } from "@/lib/f1";

export const dynamic = "force-dynamic";

// JSON endpoint over the same data the dashboard renders — handy for scripts and health checks.
export async function GET() {
  try {
    const [standings, lastRace] = await Promise.all([getDriverStandings(), getLastRace()]);
    return NextResponse.json({ standings, lastRace });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
