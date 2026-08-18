"use client";

// Central dashboard state: which season/meeting/session is selected, the
// transformed data bundle for that session, and small bits of UI state that
// several components share (sidebar, search highlight). Everything else keeps
// its state local to its own component.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { f1, f1safe } from "./f1client";
import {
  allStints,
  driverMap,
  fastestLapAcross,
  finalClassification,
  isLiveSession,
  latestWeather,
  lookupDriver,
  paceSeries,
  pitStopTable,
  positionTimeline,
  raceControlFeed,
  resultsClassification,
  sessionMeta,
  teamRadioClips,
  telemetrySamples,
  toMeeting,
  toSessionInfo,
  trackPath,
  weatherTimeline,
  type ClassificationRow,
  type Driver,
  type DriverLaps,
  type DriverPositions,
  type DriverStints,
  type FastestLap,
  type Meeting,
  type PitStop,
  type RaceControlMsg,
  type RadioClip,
  type SessionInfo,
  type SessionMeta,
  type TrackPoint,
  type Weather,
  type WeatherPoint,
} from "./openf1";

export type Bundle = {
  drivers: Driver[];
  classification: ClassificationRow[];
  pace: DriverLaps[];
  fastestLap: FastestLap | null;
  stints: DriverStints[];
  pits: PitStop[];
  raceControl: RaceControlMsg[];
  radio: RadioClip[];
  weather: Weather | null;
  weatherSeries: WeatherPoint[];
  positions: DriverPositions[];
  track: TrackPoint[];
  totalLaps: number;
};

type Ctx = {
  year: number;
  meetings: Meeting[];
  meeting: Meeting | null;
  sessions: SessionInfo[];
  session: SessionInfo | null;
  meta: SessionMeta | null;
  live: boolean;
  bundle: Bundle | null;
  loading: boolean;
  error: string | null;
  setYear: (y: number) => void;
  selectMeeting: (key: number) => void;
  selectSession: (key: number) => void;
  highlight: number | null;
  setHighlight: (num: number | null) => void;
};

const DashboardCtx = createContext<Ctx | null>(null);

export function useDashboard(): Ctx {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard outside provider");
  return ctx;
}

export const YEARS = [2026, 2025, 2024, 2023];

function pickDefaultSession(sessions: SessionInfo[]): SessionInfo | null {
  if (!sessions.length) return null;
  return sessions.find((s) => s.name === "Race") ?? sessions[sessions.length - 1];
}

async function loadBundle(sk: number, live: boolean): Promise<Bundle> {
  const opts = { live };
  const [rawDrivers, sessionResult, positions, laps, stints, pit, rc, radio, weather] =
    await Promise.all([
      f1safe("drivers", { session_key: sk }, opts),
      f1safe("session_result", { session_key: sk }, opts),
      f1safe("position", { session_key: sk }, opts),
      f1safe("laps", { session_key: sk }, opts),
      f1safe("stints", { session_key: sk }, opts),
      f1safe("pit", { session_key: sk }, opts),
      f1safe("race_control", { session_key: sk }, opts),
      f1safe("team_radio", { session_key: sk }, opts),
      f1safe("weather", { session_key: sk }, opts),
    ]);

  const drivers = driverMap(rawDrivers);
  const fromResults = resultsClassification(sessionResult, drivers);
  const classification = fromResults.length ? fromResults : finalClassification(positions, drivers);
  const allNumbers = [...drivers.keys()];
  const pace = paceSeries(laps, drivers, allNumbers).sort((a, b) => a.fastest - b.fastest);
  const totalLaps = laps.reduce((m: number, l: any) => Math.max(m, Number(l?.lap_number) || 0), 0);

  // Fastest lap → telemetry trace + 3D track path, fetched together since both
  // need the lap's time window.
  let fastestLap: FastestLap | null = null;
  let track: TrackPoint[] = [];
  const best = fastestLapAcross(laps);
  if (best) {
    const startMs = Date.parse(best.date_start);
    const endISO = new Date(startMs + (best.lap_duration + 3) * 1000).toISOString();
    const window = {
      session_key: sk,
      driver_number: best.driver_number,
      "date>": best.date_start,
      "date<": endISO,
    };
    const [carData, locations] = await Promise.all([
      f1safe("car_data", window, opts),
      f1safe("location", window, opts),
    ]);
    const samples = telemetrySamples(carData, best.date_start);
    fastestLap = {
      driver: lookupDriver(drivers, best.driver_number),
      lapNumber: best.lap_number,
      lapTime: best.lap_duration,
      topSpeed: samples.length ? Math.max(...samples.map((s) => s.speed)) : 0,
      samples,
    };
    track = trackPath(locations);
  }

  const top10 = classification.slice(0, 10).map((c) => c.driver.number);

  return {
    drivers: [...drivers.values()],
    classification,
    pace,
    fastestLap,
    stints: allStints(stints, classification),
    pits: pitStopTable(pit, drivers),
    raceControl: raceControlFeed(rc),
    radio: teamRadioClips(radio, drivers),
    weather: latestWeather(weather),
    weatherSeries: weatherTimeline(weather),
    positions: positionTimeline(positions, drivers, top10),
    track,
    totalLaps,
  };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [year, setYearState] = useState(YEARS[0]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const loadSeq = useRef(0);

  const live = useMemo(() => (session ? isLiveSession(session) : false), [session]);
  const meta = useMemo(
    () => (meeting && session ? sessionMeta(meeting, session) : null),
    [meeting, session],
  );

  // Boot: latest session → its meeting/year → the season around it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [latest] = await f1("sessions", { session_key: "latest" });
        if (!latest || cancelled) return;
        const info = toSessionInfo(latest);
        const y = Number(latest.year) || YEARS[0];
        const [rawMeetings, rawSessions] = await Promise.all([
          f1("meetings", { year: y }),
          f1("sessions", { meeting_key: info.meetingKey }),
        ]);
        if (cancelled) return;
        const ms = rawMeetings.map(toMeeting);
        setYearState(y);
        setMeetings(ms);
        setMeeting(ms.find((m) => m.key === info.meetingKey) ?? null);
        setSessions(rawSessions.map(toSessionInfo));
        setSession(info);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not reach the timing feed");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Session selected → (re)load the bundle. Polls while the session is live.
  useEffect(() => {
    if (!session) return;
    const seq = ++loadSeq.current;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = async (initial: boolean) => {
      if (initial) {
        setLoading(true);
        setBundle(null);
      }
      try {
        const b = await loadBundle(session.key, live);
        if (loadSeq.current === seq) {
          setBundle(b);
          setError(null);
        }
      } catch (e) {
        if (loadSeq.current === seq && initial) {
          setError(e instanceof Error ? e.message : "Failed to load session data");
        }
      } finally {
        if (loadSeq.current === seq) setLoading(false);
      }
    };

    run(true);
    if (live) timer = setInterval(() => run(false), 30_000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session, live]);

  const setYear = useCallback(async (y: number) => {
    setYearState(y);
    try {
      const rawMeetings = await f1("meetings", { year: y });
      const ms = rawMeetings.map(toMeeting);
      setMeetings(ms);
      // Latest meeting that has already started, else the first of the season.
      const now = new Date().toISOString();
      const started = ms.filter((m) => m.dateStart && m.dateStart <= now);
      const pick = started.length ? started[started.length - 1] : ms[0];
      if (pick) await selectMeetingInner(pick, setSessions, setSession, setMeeting);
    } catch {
      setError("Failed to load season");
    }
  }, []);

  const selectMeeting = useCallback(
    async (key: number) => {
      const m = meetings.find((mm) => mm.key === key);
      if (!m) return;
      try {
        await selectMeetingInner(m, setSessions, setSession, setMeeting);
      } catch {
        setError("Failed to load meeting");
      }
    },
    [meetings],
  );

  const selectSession = useCallback(
    (key: number) => {
      const s = sessions.find((ss) => ss.key === key);
      if (s) setSession(s);
    },
    [sessions],
  );

  const value: Ctx = {
    year,
    meetings,
    meeting,
    sessions,
    session,
    meta,
    live,
    bundle,
    loading,
    error,
    setYear,
    selectMeeting,
    selectSession,
    highlight,
    setHighlight,
  };

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

async function selectMeetingInner(
  m: Meeting,
  setSessions: (s: SessionInfo[]) => void,
  setSession: (s: SessionInfo | null) => void,
  setMeeting: (m: Meeting) => void,
) {
  const rawSessions = await f1("sessions", { meeting_key: m.key });
  const ss = rawSessions.map(toSessionInfo);
  setMeeting(m);
  setSessions(ss);
  setSession(pickDefaultSession(ss));
}
