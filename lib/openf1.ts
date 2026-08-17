// Server-side client for the OpenF1 API (https://openf1.org).
// Fetching is separated from the pure transforms so the transforms can be
// exercised offline (see openf1.selfcheck.ts). All data here is historical for a
// completed session, so responses are cached aggressively.

const BASE = "https://api.openf1.org/v1";

export type Driver = {
  number: number;
  acronym: string;
  fullName: string;
  team: string;
  colour: string; // hex without leading '#'
  headshot: string;
};

export type ClassificationRow = { position: number; driver: Driver };

export type TelemetrySample = {
  t: number; // seconds since lap start
  speed: number;
  throttle: number; // 0-100
  brake: number; // 0-100
  gear: number;
  drs: boolean;
};

export type FastestLap = {
  driver: Driver;
  lapNumber: number;
  lapTime: number; // seconds
  topSpeed: number;
  samples: TelemetrySample[];
};

export type LapPoint = { lap: number; time: number };
export type DriverLaps = { driver: Driver; laps: LapPoint[]; fastest: number };

export type Stint = { compound: string; lapStart: number; lapEnd: number };
export type DriverStints = { driver: Driver; stints: Stint[]; totalLaps: number };

export type Weather = {
  airTemperature: number;
  trackTemperature: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  pressure: number;
};

export type SessionMeta = {
  meetingName: string;
  officialName: string;
  sessionName: string;
  circuit: string;
  country: string;
  countryCode: string;
  flag: string;
  circuitImage: string;
  date: string;
  year: number;
  sessionKey: number;
  meetingKey: number;
};

export type RaceData = {
  session: SessionMeta;
  classification: ClassificationRow[];
  fastestLap: FastestLap | null;
  pace: DriverLaps[];
  strategy: DriverStints | null;
  weather: Weather | null;
};

// ---------------------------------------------------------------------------
// Pure transforms (unit-checkable, no network)
// ---------------------------------------------------------------------------

export function toDriver(raw: any): Driver {
  return {
    number: Number(raw?.driver_number) || 0,
    acronym: raw?.name_acronym ?? "",
    fullName: raw?.full_name ?? raw?.broadcast_name ?? "Unknown",
    team: raw?.team_name ?? "",
    colour: (raw?.team_colour ?? "888888").replace(/^#/, ""),
    headshot: raw?.headshot_url ?? "",
  };
}

export function driverMap(rawDrivers: any[]): Map<number, Driver> {
  const map = new Map<number, Driver>();
  for (const raw of rawDrivers ?? []) {
    const d = toDriver(raw);
    if (d.number) map.set(d.number, d);
  }
  return map;
}

const UNKNOWN_DRIVER: Driver = {
  number: 0,
  acronym: "—",
  fullName: "Unknown",
  team: "",
  colour: "888888",
  headshot: "",
};

// Latest recorded position per driver → final classification, sorted.
export function finalClassification(
  positions: any[],
  drivers: Map<number, Driver>,
): ClassificationRow[] {
  const latest = new Map<number, { position: number; date: string }>();
  for (const p of positions ?? []) {
    const num = Number(p?.driver_number);
    const pos = Number(p?.position);
    const date = String(p?.date ?? "");
    if (!num || !pos) continue;
    const prev = latest.get(num);
    if (!prev || date > prev.date) latest.set(num, { position: pos, date });
  }
  return [...latest.entries()]
    .map(([num, { position }]) => ({ position, driver: drivers.get(num) ?? { ...UNKNOWN_DRIVER, number: num } }))
    .sort((a, b) => a.position - b.position);
}

function isRacingLap(lap: any): boolean {
  return typeof lap?.lap_duration === "number" && lap.lap_duration > 0 && !lap?.is_pit_out_lap;
}

export function fastestLapAcross(laps: any[]): { driver_number: number; lap_number: number; lap_duration: number; date_start: string } | null {
  let best: any = null;
  for (const lap of laps ?? []) {
    if (!isRacingLap(lap)) continue;
    if (!best || lap.lap_duration < best.lap_duration) best = lap;
  }
  if (!best) return null;
  return {
    driver_number: Number(best.driver_number),
    lap_number: Number(best.lap_number),
    lap_duration: Number(best.lap_duration),
    date_start: String(best.date_start),
  };
}

// DRS codes: 0/1 off, 8 eligible, 10/12/14 active. Treat >=10 as active.
export function telemetrySamples(carData: any[], lapStartISO: string): TelemetrySample[] {
  const start = Date.parse(lapStartISO);
  if (!Number.isFinite(start)) return [];
  return (carData ?? [])
    .map((s) => ({
      t: (Date.parse(s?.date) - start) / 1000,
      speed: Number(s?.speed) || 0,
      throttle: Number(s?.throttle) || 0,
      brake: Number(s?.brake) || 0,
      gear: Number(s?.n_gear) || 0,
      drs: Number(s?.drs) >= 10,
    }))
    .filter((s) => Number.isFinite(s.t) && s.t >= -0.5)
    .sort((a, b) => a.t - b.t);
}

// Per-driver lap-time series, dropping pit laps and gross outliers (safety cars).
export function paceSeries(
  laps: any[],
  drivers: Map<number, Driver>,
  driverNumbers: number[],
): DriverLaps[] {
  const out: DriverLaps[] = [];
  for (const num of driverNumbers) {
    const own = (laps ?? [])
      .filter((l) => Number(l?.driver_number) === num && isRacingLap(l))
      .map((l) => ({ lap: Number(l.lap_number), time: Number(l.lap_duration) }))
      .sort((a, b) => a.lap - b.lap);
    if (!own.length) continue;
    const fastest = Math.min(...own.map((l) => l.time));
    // Drop laps slower than 130% of the driver's fastest (SC / traffic) to keep the trend readable.
    const clean = own.filter((l) => l.time <= fastest * 1.3);
    out.push({ driver: drivers.get(num) ?? { ...UNKNOWN_DRIVER, number: num }, laps: clean, fastest });
  }
  return out;
}

export function driverStints(stints: any[], driverNumber: number, driver: Driver): DriverStints {
  const own = (stints ?? [])
    .filter((s) => Number(s?.driver_number) === driverNumber && s?.lap_start && s?.lap_end)
    .map((s) => ({
      compound: (s.compound ?? "UNKNOWN").toUpperCase(),
      lapStart: Number(s.lap_start),
      lapEnd: Number(s.lap_end),
    }))
    .sort((a, b) => a.lapStart - b.lapStart);
  const totalLaps = own.length ? Math.max(...own.map((s) => s.lapEnd)) : 0;
  return { driver, stints: own, totalLaps };
}

export function latestWeather(weather: any[]): Weather | null {
  if (!weather?.length) return null;
  const w = weather.reduce((a, b) => (String(a?.date) > String(b?.date) ? a : b));
  return {
    airTemperature: Number(w.air_temperature) || 0,
    trackTemperature: Number(w.track_temperature) || 0,
    humidity: Number(w.humidity) || 0,
    windSpeed: Number(w.wind_speed) || 0,
    rainfall: Number(w.rainfall) || 0,
    pressure: Number(w.pressure) || 0,
  };
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

async function api(path: string): Promise<any[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`OpenF1 ${res.status} for ${path}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function getSessionMeta(): Promise<SessionMeta> {
  const [session] = await api(`/sessions?session_key=latest`);
  if (!session) throw new Error("No latest session available from OpenF1");
  const [meeting] = await api(`/meetings?meeting_key=${session.meeting_key}`);
  return {
    meetingName: meeting?.meeting_name ?? session.circuit_short_name ?? "Grand Prix",
    officialName: meeting?.meeting_official_name ?? "",
    sessionName: session.session_name ?? "Session",
    circuit: session.circuit_short_name ?? meeting?.circuit_short_name ?? "",
    country: session.country_name ?? meeting?.country_name ?? "",
    countryCode: session.country_code ?? "",
    flag: meeting?.country_flag ?? "",
    circuitImage: meeting?.circuit_image ?? "",
    date: session.date_start ?? "",
    year: Number(session.year) || new Date().getFullYear(),
    sessionKey: Number(session.session_key),
    meetingKey: Number(session.meeting_key),
  };
}

export async function getRaceData(): Promise<RaceData> {
  const session = await getSessionMeta();
  const sk = session.sessionKey;

  const [rawDrivers, positions, laps, weather, stints] = await Promise.all([
    safe(() => api(`/drivers?session_key=${sk}`), [] as any[]),
    safe(() => api(`/position?session_key=${sk}`), [] as any[]),
    safe(() => api(`/laps?session_key=${sk}`), [] as any[]),
    safe(() => api(`/weather?session_key=${sk}`), [] as any[]),
    safe(() => api(`/stints?session_key=${sk}`), [] as any[]),
  ]);

  const drivers = driverMap(rawDrivers);
  const classification = finalClassification(positions, drivers);
  const topNumbers = classification.slice(0, 5).map((c) => c.driver.number);

  const pace = paceSeries(laps, drivers, topNumbers);

  // Fastest lap of the race → telemetry trace.
  let fastestLap: FastestLap | null = null;
  const best = fastestLapAcross(laps);
  if (best) {
    const startMs = Date.parse(best.date_start);
    const endISO = new Date(startMs + (best.lap_duration + 3) * 1000).toISOString();
    const carData = await safe(
      () =>
        api(
          `/car_data?session_key=${sk}&driver_number=${best.driver_number}` +
            `&date>${encodeURIComponent(best.date_start)}&date<${encodeURIComponent(endISO)}`,
        ),
      [] as any[],
    );
    const samples = telemetrySamples(carData, best.date_start);
    fastestLap = {
      driver: drivers.get(best.driver_number) ?? { ...UNKNOWN_DRIVER, number: best.driver_number },
      lapNumber: best.lap_number,
      lapTime: best.lap_duration,
      topSpeed: samples.length ? Math.max(...samples.map((s) => s.speed)) : 0,
      samples,
    };
  }

  const winnerNum = classification[0]?.driver.number;
  const strategy =
    winnerNum != null
      ? driverStints(stints, winnerNum, classification[0].driver)
      : null;

  return {
    session,
    classification,
    fastestLap,
    pace,
    strategy,
    weather: latestWeather(weather),
  };
}
