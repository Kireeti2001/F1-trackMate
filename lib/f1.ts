// Thin client for the public Jolpica (Ergast-compatible) Formula 1 API.
// Docs: https://github.com/jolpica/jolpica-f1  |  Base: https://api.jolpi.ca/ergast/f1
// Parsing is split out from fetching so it can be exercised offline (see f1.selfcheck.ts).

const BASE = "https://api.jolpi.ca/ergast/f1";

export type DriverStanding = {
  position: number;
  name: string;
  code: string;
  nationality: string;
  team: string;
  points: number;
  wins: number;
};

export type StandingsTable = {
  season: string;
  round: string;
  standings: DriverStanding[];
};

export type RaceResult = {
  position: number;
  name: string;
  code: string;
  team: string;
  time: string;
  points: number;
};

export type LastRace = {
  name: string;
  circuit: string;
  locality: string;
  country: string;
  date: string;
  results: RaceResult[];
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Raw Ergast shapes are loose; validate at this trust boundary and normalize.
export function parseDriverStandings(raw: unknown): StandingsTable {
  const table = (raw as any)?.MRData?.StandingsTable;
  const list = table?.StandingsLists?.[0];
  const rows: any[] = list?.DriverStandings ?? [];
  const standings: DriverStanding[] = rows.map((row) => {
    const driver = row?.Driver ?? {};
    const team = row?.Constructors?.[0]?.name ?? "—";
    return {
      position: num(row?.position),
      name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim() || "Unknown",
      code: driver.code ?? "",
      nationality: driver.nationality ?? "",
      team,
      points: num(row?.points),
      wins: num(row?.wins),
    };
  });
  return {
    season: String(list?.season ?? table?.season ?? ""),
    round: String(list?.round ?? table?.round ?? ""),
    standings,
  };
}

export function parseLastRace(raw: unknown): LastRace | null {
  const race = (raw as any)?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;
  const results: RaceResult[] = (race.Results ?? []).map((row: any) => {
    const driver = row?.Driver ?? {};
    return {
      position: num(row?.position),
      name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim() || "Unknown",
      code: driver.code ?? "",
      team: row?.Constructor?.name ?? "—",
      time: row?.Time?.time ?? row?.status ?? "",
      points: num(row?.points),
    };
  });
  return {
    name: race.raceName ?? "Grand Prix",
    circuit: race.Circuit?.circuitName ?? "",
    locality: race.Circuit?.Location?.locality ?? "",
    country: race.Circuit?.Location?.country ?? "",
    date: race.date ?? "",
    results,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`F1 API ${res.status} for ${url}`);
  return res.json();
}

export async function getDriverStandings(): Promise<StandingsTable> {
  return parseDriverStandings(await fetchJson(`${BASE}/current/driverStandings.json`));
}

export async function getLastRace(): Promise<LastRace | null> {
  return parseLastRace(await fetchJson(`${BASE}/current/last/results.json`));
}
