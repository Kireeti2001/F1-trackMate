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
  latestWeather,
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
];
const strat = driverStints(stints, 1, drivers.get(1)!);
assert.equal(strat.stints.length, 2);
assert.equal(strat.stints[0].compound, "MEDIUM");
assert.equal(strat.stints[1].compound, "UNKNOWN");
assert.equal(strat.totalLaps, 45);

// latestWeather picks the newest record.
const weather = latestWeather([
  { date: "2026-07-26T14:00:00Z", air_temperature: 30, track_temperature: 45, humidity: 30, wind_speed: 2, rainfall: 0, pressure: 980 },
  { date: "2026-07-26T14:45:00Z", air_temperature: 31.3, track_temperature: 47, humidity: 26.6, wind_speed: 1.9, rainfall: 0, pressure: 979.4 },
]);
assert.ok(weather);
assert.equal(weather.trackTemperature, 47);

console.log("openf1 self-check passed: classification, fastest lap, telemetry, pace, stints, weather");
