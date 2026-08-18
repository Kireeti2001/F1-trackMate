// Offline self-check for the OpenF1 transforms. No network, no test framework.
// Run with: npm run check
import assert from "node:assert/strict";
import {
  driverMap,
  finalClassification,
  fastestLapAcross,
  telemetrySamples,
  paceSeries,
  driverStints,
  allStints,
  latestWeather,
  weatherTimeline,
  formatGap,
  resultsClassification,
  pitStopTable,
  raceControlFeed,
  teamRadioClips,
  positionTimeline,
  trackPath,
  isLiveSession,
  formatLapTime,
  toSessionInfo,
} from "./openf1";

const rawDrivers = [
  { driver_number: 1, name_acronym: "NOR", full_name: "Lando NORRIS", team_name: "McLaren", team_colour: "F47600" },
  { driver_number: 3, name_acronym: "VER", full_name: "Max VERSTAPPEN", team_name: "Red Bull Racing", team_colour: "#4781D7" },
];
const drivers = driverMap(rawDrivers);
assert.equal(drivers.size, 2);
assert.equal(drivers.get(3)!.colour, "4781D7"); // leading '#' stripped

// finalClassification takes the latest date per driver and sorts by position.
const positions = [
  { driver_number: 1, position: 3, date: "2026-07-26T13:00:00Z" },
  { driver_number: 1, position: 1, date: "2026-07-26T15:00:00Z" },
  { driver_number: 3, position: 2, date: "2026-07-26T15:00:00Z" },
];
const cls = finalClassification(positions, drivers);
assert.equal(cls.length, 2);
assert.equal(cls[0].position, 1);
assert.equal(cls[0].driver.acronym, "NOR");
assert.equal(cls[1].driver.number, 3);

// fastestLapAcross ignores pit-out laps and picks the minimum duration.
const laps = [
  { driver_number: 1, lap_number: 1, lap_duration: 120.0, date_start: "2026-07-26T13:01:00Z", is_pit_out_lap: false },
  { driver_number: 1, lap_number: 20, lap_duration: 82.4, date_start: "2026-07-26T13:20:00Z", is_pit_out_lap: false },
  { driver_number: 3, lap_number: 18, lap_duration: 80.9, date_start: "2026-07-26T13:18:00Z", is_pit_out_lap: false },
  { driver_number: 3, lap_number: 19, lap_duration: 70.0, date_start: "2026-07-26T13:19:00Z", is_pit_out_lap: true },
];
const best = fastestLapAcross(laps);
assert.ok(best);
assert.equal(best.driver_number, 3);
assert.equal(best.lap_number, 18);

// telemetrySamples converts absolute timestamps to seconds-since-lap-start and decodes DRS.
const carData = [
  { date: "2026-07-26T13:18:02Z", speed: 300, throttle: 100, brake: 0, n_gear: 7, drs: 12 },
  { date: "2026-07-26T13:18:00Z", speed: 120, throttle: 0, brake: 100, n_gear: 2, drs: 0 },
];
const samples = telemetrySamples(carData, "2026-07-26T13:18:00Z");
assert.equal(samples.length, 2);
assert.equal(samples[0].t, 0); // sorted by time
assert.equal(samples[0].drs, false);
assert.equal(samples[1].t, 2);
assert.equal(samples[1].drs, true);

// paceSeries drops outliers slower than 130% of a driver's fastest lap.
const pace = paceSeries(laps, drivers, [1]);
assert.equal(pace.length, 1);
assert.equal(pace[0].fastest, 82.4);
assert.equal(pace[0].laps.length, 1); // 120.0 > 82.4 * 1.3 dropped

// driverStints normalizes compound and computes total laps.
const stints = [
  { driver_number: 1, lap_start: 1, lap_end: 20, compound: "medium" },
  { driver_number: 1, lap_start: 21, lap_end: 45, compound: null },
  { driver_number: 3, lap_start: 1, lap_end: 45, compound: "hard" },
];
const strat = driverStints(stints, 1, drivers.get(1)!);
assert.equal(strat.stints.length, 2);
assert.equal(strat.stints[0].compound, "MEDIUM");
assert.equal(strat.stints[1].compound, "UNKNOWN");
assert.equal(strat.totalLaps, 45);

// allStints keeps finishing order and drops drivers with no stint data.
const boards = allStints(stints, cls);
assert.equal(boards.length, 2);
assert.equal(boards[0].driver.number, 1); // P1 first

// latestWeather picks the newest record.
const weatherRows = [
  { date: "2026-07-26T14:00:00Z", air_temperature: 30, track_temperature: 45, humidity: 30, wind_speed: 2, rainfall: 0, pressure: 980 },
  { date: "2026-07-26T14:45:00Z", air_temperature: 31.3, track_temperature: 47, humidity: 26.6, wind_speed: 1.9, rainfall: 0, pressure: 979.4 },
];
const weather = latestWeather(weatherRows);
assert.ok(weather);
assert.equal(weather.trackTemperature, 47);

// weatherTimeline is chronological, minutes from the first sample.
const wxSeries = weatherTimeline(weatherRows);
assert.equal(wxSeries.length, 2);
assert.equal(wxSeries[0].t, 0);
assert.equal(wxSeries[1].t, 45);
assert.equal(wxSeries[1].track, 47);

// formatGap covers numbers, strings, qualifying arrays and DNF states.
assert.equal(formatGap(0), "Leader");
assert.equal(formatGap(15.08), "+15.080s");
assert.equal(formatGap("+1 LAP"), "+1 LAP");
assert.equal(formatGap([0.1, 0.3, null]), "+0.300s");
assert.equal(formatGap(5, { dnf: true }), "DNF");
assert.equal(formatGap(null), "—");

// resultsClassification merges session_result with driver info, sorted.
const results = resultsClassification(
  [
    { position: 2, driver_number: 3, points: 18, gap_to_leader: 15.08, number_of_laps: 70 },
    { position: 1, driver_number: 1, points: 25, gap_to_leader: 0, number_of_laps: 70 },
  ],
  drivers,
);
assert.equal(results[0].driver.acronym, "NOR");
assert.equal(results[0].gap, "Leader");
assert.equal(results[1].points, 18);

// pitStopTable ranks by duration and skips invalid rows.
const pits = pitStopTable(
  [
    { driver_number: 1, lap_number: 20, pit_duration: 22.3 },
    { driver_number: 3, lap_number: 18, pit_duration: 21.1 },
    { driver_number: 3, lap_number: 40, pit_duration: null },
  ],
  drivers,
);
assert.equal(pits.length, 2);
assert.equal(pits[0].driver.number, 3); // fastest first

// raceControlFeed is newest-first and keeps flag metadata.
const rc = raceControlFeed([
  { date: "2026-07-26T13:00:00Z", category: "Flag", flag: "GREEN", message: "GREEN LIGHT" },
  { date: "2026-07-26T14:00:00Z", category: "SafetyCar", flag: null, message: "SC DEPLOYED" },
]);
assert.equal(rc[0].message, "SC DEPLOYED");
assert.equal(rc[1].flag, "GREEN");

// teamRadioClips resolves drivers and caps the list.
const radio = teamRadioClips(
  [
    { driver_number: 1, date: "2026-07-26T13:10:00Z", recording_url: "https://x/a.mp3" },
    { driver_number: 3, date: "2026-07-26T13:20:00Z", recording_url: "https://x/b.mp3" },
  ],
  drivers,
  1,
);
assert.equal(radio.length, 1);
assert.equal(radio[0].driver.acronym, "VER"); // newest first

// positionTimeline produces per-driver step series in minutes.
const timeline = positionTimeline(positions, drivers, [1, 3]);
assert.equal(timeline.length, 2);
assert.equal(timeline[0].points[0].t, 0);
assert.equal(timeline[0].points[1].t, 120); // 2h later
assert.equal(timeline[0].final, 1);

// trackPath centres and unit-scales GPS samples (needs at least 8 points).
const circle = Array.from({ length: 40 }, (_, i) => ({
  x: Math.cos((i / 40) * 2 * Math.PI) * 5000,
  y: Math.sin((i / 40) * 2 * Math.PI) * 5000,
  z: 100,
}));
const path = trackPath(circle, 20);
assert.ok(path.length >= 8 && path.length <= 40);
assert.ok(path.every((p) => Math.abs(p.x) <= 0.55 && Math.abs(p.z) <= 0.55));
assert.equal(trackPath(circle.slice(0, 3)).length, 0);

// isLiveSession respects the window plus a post-race buffer.
const session = toSessionInfo({
  session_key: 1,
  meeting_key: 2,
  session_name: "Race",
  date_start: "2026-07-26T13:00:00Z",
  date_end: "2026-07-26T15:00:00Z",
});
assert.equal(isLiveSession(session, Date.parse("2026-07-26T14:00:00Z")), true);
assert.equal(isLiveSession(session, Date.parse("2026-07-26T15:10:00Z")), true); // buffer
assert.equal(isLiveSession(session, Date.parse("2026-07-26T16:00:00Z")), false);

// formatLapTime renders m:ss.mmm.
assert.equal(formatLapTime(80.123), "1:20.123");

console.log(
  "openf1 self-check passed: classification, results, gaps, fastest lap, telemetry, pace, stints, pits, race control, radio, positions, track path, weather, live window",
);
