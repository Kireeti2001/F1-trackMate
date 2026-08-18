// Types + pure transforms for the OpenF1 API (https://openf1.org).
// Transforms are network-free so they can be exercised offline
// (see openf1.selfcheck.ts). Fetching happens client-side through the
// /api/f1 proxy (see lib/f1client.ts).

export type Driver = {
  number: number;
  acronym: string;
  fullName: string;
  team: string;
  colour: string; // hex without leading '#'
  headshot: string;
};

export type ClassificationRow = {
  position: number;
  driver: Driver;
  gap?: string; // "+12.4s", "+1 LAP", "DNF" …
  points?: number;
  laps?: number;
};

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

export type WeatherPoint = { t: number; track: number; air: number };

export type PitStop = { driver: Driver; lap: number; duration: number };

export type RaceControlMsg = {
  date: string;
  lap: number;
  category: string;
  flag: string | null;
  scope: string | null;
  message: string;
  driverNumber: number | null;
};

export type RadioClip = { driver: Driver; date: string; url: string };

export type PosSample = { t: number; position: number }; // t = minutes since session start
export type DriverPositions = { driver: Driver; points: PosSample[]; final: number };

export type TrackPoint = { x: number; y: number; z: number };

export type Meeting = {
  key: number;
  name: string;
  officialName: string;
  circuit: string;
  country: string;
  countryCode: string;
  flag: string;
  circuitImage: string;
  dateStart: string;
  year: number;
};

export type SessionInfo = {
  key: number;
  meetingKey: number;
  name: string;
  type: string;
  dateStart: string;
  dateEnd: string;
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

export function lookupDriver(drivers: Map<number, Driver>, num: number): Driver {
  return drivers.get(num) ?? { ...UNKNOWN_DRIVER, number: num, acronym: `#${num}` };
}

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
    .map(([num, { position }]) => ({ position, driver: lookupDriver(drivers, num) }))
    .sort((a, b) => a.position - b.position);
}

// gap_to_leader can be a number (seconds), a string ("+1 LAP") or, for
// qualifying, an array of per-segment values. Reduce it to a display string.
export function formatGap(raw: any, status?: { dnf?: boolean; dns?: boolean; dsq?: boolean }): string {
  if (status?.dsq) return "DSQ";
  if (status?.dns) return "DNS";
  if (status?.dnf) return "DNF";
  const val = Array.isArray(raw) ? [...raw].reverse().find((v) => v != null) : raw;
  if (val == null) return "—";
  if (typeof val === "number") return val === 0 ? "Leader" : `+${val.toFixed(3)}s`;
  return String(val);
}

// session_result rows → classification with gaps/points, falling back to
// nothing when the endpoint is empty (older sessions).
export function resultsClassification(
  sessionResult: any[],
  drivers: Map<number, Driver>,
): ClassificationRow[] {
  return (sessionResult ?? [])
    .filter((r) => r?.driver_number != null)
    .map((r) => ({
      position: Number(r.position) || 0,
      driver: lookupDriver(drivers, Number(r.driver_number)),
      gap: formatGap(r.gap_to_leader, r),
      points: typeof r.points === "number" ? r.points : undefined,
      laps: Number(r.number_of_laps) || undefined,
    }))
    .sort((a, b) => (a.position || 99) - (b.position || 99));
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
    out.push({ driver: lookupDriver(drivers, num), laps: clean, fastest });
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

// Stint timelines for every classified driver, in finishing order.
export function allStints(stints: any[], order: ClassificationRow[]): DriverStints[] {
  return order
    .map((row) => driverStints(stints, row.driver.number, row.driver))
    .filter((d) => d.stints.length > 0);
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

// Track/air temperature over the session, minutes since first sample.
export function weatherTimeline(weather: any[]): WeatherPoint[] {
  const rows = (weather ?? [])
    .filter((w) => w?.date && w?.track_temperature != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!rows.length) return [];
  const t0 = Date.parse(rows[0].date);
  return rows.map((w) => ({
    t: (Date.parse(w.date) - t0) / 60000,
    track: Number(w.track_temperature) || 0,
    air: Number(w.air_temperature) || 0,
  }));
}

// Pit-lane stops, fastest first.
export function pitStopTable(pit: any[], drivers: Map<number, Driver>): PitStop[] {
  return (pit ?? [])
    .filter((p) => Number(p?.pit_duration) > 0 && p?.driver_number != null)
    .map((p) => ({
      driver: lookupDriver(drivers, Number(p.driver_number)),
      lap: Number(p.lap_number) || 0,
      duration: Number(p.pit_duration),
    }))
    .sort((a, b) => a.duration - b.duration);
}

// Race-control feed, newest first.
export function raceControlFeed(raw: any[]): RaceControlMsg[] {
  return (raw ?? [])
    .filter((m) => m?.message)
    .map((m) => ({
      date: String(m.date ?? ""),
      lap: Number(m.lap_number) || 0,
      category: String(m.category ?? "Other"),
      flag: m.flag ? String(m.flag) : null,
      scope: m.scope ? String(m.scope) : null,
      message: String(m.message),
      driverNumber: m.driver_number != null ? Number(m.driver_number) : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Team-radio clips, newest first, capped so the grid stays digestible.
export function teamRadioClips(raw: any[], drivers: Map<number, Driver>, limit = 24): RadioClip[] {
  return (raw ?? [])
    .filter((r) => r?.recording_url)
    .map((r) => ({
      driver: lookupDriver(drivers, Number(r.driver_number)),
      date: String(r.date ?? ""),
      url: String(r.recording_url),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// Position-vs-time step series for the given drivers (minutes since start).
export function positionTimeline(
  positions: any[],
  drivers: Map<number, Driver>,
  driverNumbers: number[],
): DriverPositions[] {
  const sorted = (positions ?? [])
    .filter((p) => p?.date && p?.driver_number != null && p?.position != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!sorted.length) return [];
  const t0 = Date.parse(sorted[0].date);
  const byDriver = new Map<number, PosSample[]>();
  for (const p of sorted) {
    const num = Number(p.driver_number);
    if (!driverNumbers.includes(num)) continue;
    const arr = byDriver.get(num) ?? [];
    arr.push({ t: (Date.parse(p.date) - t0) / 60000, position: Number(p.position) });
    byDriver.set(num, arr);
  }
  return driverNumbers
    .filter((num) => byDriver.has(num))
    .map((num) => {
      const points = byDriver.get(num)!;
      return { driver: lookupDriver(drivers, num), points, final: points[points.length - 1].position };
    });
}

// Normalise raw car-location samples into a centred, unit-scaled 3D path for
// the track map. Downsamples to ~`maxPoints` and closes the loop.
export function trackPath(locations: any[], maxPoints = 360): TrackPoint[] {
  const pts = (locations ?? [])
    .filter((l) => l?.x != null && l?.y != null)
    .map((l) => ({ x: Number(l.x), y: Number(l.y), z: Number(l.z) || 0 }));
  if (pts.length < 8) return [];
  const step = Math.max(1, Math.floor(pts.length / maxPoints));
  const sampled = pts.filter((_, i) => i % step === 0);
  const xs = sampled.map((p) => p.x);
  const ys = sampled.map((p) => p.y);
  const zs = sampled.map((p) => p.z);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  // World layout: track plane on XZ, elevation (F1 z) becomes Y with gentle exaggeration.
  return sampled.map((p) => ({
    x: (p.x - cx) / span,
    y: ((p.z - cz) / span) * 0.6,
    z: -(p.y - cy) / span,
  }));
}

export function toMeeting(raw: any): Meeting {
  return {
    key: Number(raw?.meeting_key) || 0,
    name: raw?.meeting_name ?? "Grand Prix",
    officialName: raw?.meeting_official_name ?? "",
    circuit: raw?.circuit_short_name ?? "",
    country: raw?.country_name ?? "",
    countryCode: raw?.country_code ?? "",
    flag: raw?.country_flag ?? "",
    circuitImage: raw?.circuit_image ?? "",
    dateStart: raw?.date_start ?? "",
    year: Number(raw?.year) || 0,
  };
}

export function toSessionInfo(raw: any): SessionInfo {
  return {
    key: Number(raw?.session_key) || 0,
    meetingKey: Number(raw?.meeting_key) || 0,
    name: raw?.session_name ?? "Session",
    type: raw?.session_type ?? "",
    dateStart: raw?.date_start ?? "",
    dateEnd: raw?.date_end ?? "",
  };
}

export function sessionMeta(meeting: Meeting, session: SessionInfo): SessionMeta {
  return {
    meetingName: meeting.name,
    officialName: meeting.officialName,
    sessionName: session.name,
    circuit: meeting.circuit,
    country: meeting.country,
    countryCode: meeting.countryCode,
    flag: meeting.flag,
    circuitImage: meeting.circuitImage,
    date: session.dateStart,
    year: meeting.year,
    sessionKey: session.key,
    meetingKey: meeting.key,
  };
}

export function isLiveSession(session: SessionInfo, now = Date.now()): boolean {
  const start = Date.parse(session.dateStart);
  const end = Date.parse(session.dateEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  // Small buffer after the end for the flag + in-lap.
  return now >= start && now <= end + 20 * 60 * 1000;
}

export function formatLapTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}
