import { NextRequest, NextResponse } from "next/server";

// Thin cached proxy in front of api.openf1.org so the browser hits one origin
// and repeated session loads are served from the Next.js data cache.

const BASE = "https://api.openf1.org/v1";

const ALLOWED = new Set([
  "meetings",
  "sessions",
  "drivers",
  "session_result",
  "position",
  "laps",
  "stints",
  "pit",
  "weather",
  "race_control",
  "team_radio",
  "car_data",
  "location",
  "overtakes",
  "intervals",
]);

export async function GET(req: NextRequest) {
  const ep = req.nextUrl.searchParams.get("ep") ?? "";
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const live = req.nextUrl.searchParams.get("live") === "1";
  if (!ALLOWED.has(ep)) {
    return NextResponse.json({ error: `unknown endpoint "${ep}"` }, { status: 400 });
  }
  // `q` is a raw OpenF1 query string; it may contain comparison operators in
  // parameter names (e.g. `date>...`), which is why it travels pre-encoded.
  try {
    const res = await fetch(`${BASE}/${ep}${q ? `?${q}` : ""}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: live ? 15 : 600 },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `OpenF1 ${res.status}` }, { status: res.status });
    }
    const json = await res.json();
    return NextResponse.json(Array.isArray(json) ? json : []);
  } catch {
    return NextResponse.json({ error: "OpenF1 unreachable" }, { status: 502 });
  }
}
