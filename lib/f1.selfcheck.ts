// Offline self-check for the F1 API parsers. No network, no test framework.
// Run with: npm run check
import assert from "node:assert/strict";
import { parseDriverStandings, parseLastRace } from "./f1";

const standingsFixture = {
  MRData: {
    StandingsTable: {
      season: "2024",
      round: "24",
      StandingsLists: [
        {
          season: "2024",
          round: "24",
          DriverStandings: [
            {
              position: "1",
              points: "437",
              wins: "9",
              Driver: { givenName: "Max", familyName: "Verstappen", code: "VER", nationality: "Dutch" },
              Constructors: [{ name: "Red Bull" }],
            },
            {
              position: "2",
              points: "374",
              wins: "4",
              Driver: { givenName: "Lando", familyName: "Norris", code: "NOR", nationality: "British" },
              Constructors: [{ name: "McLaren" }],
            },
          ],
        },
      ],
    },
  },
};

const raceFixture = {
  MRData: {
    RaceTable: {
      Races: [
        {
          raceName: "Abu Dhabi Grand Prix",
          date: "2024-12-08",
          Circuit: { circuitName: "Yas Marina Circuit", Location: { locality: "Abu Dhabi", country: "UAE" } },
          Results: [
            {
              position: "1",
              points: "25",
              Driver: { givenName: "Lando", familyName: "Norris", code: "NOR" },
              Constructor: { name: "McLaren" },
              Time: { time: "1:26:33.291" },
            },
          ],
        },
      ],
    },
  },
};

const standings = parseDriverStandings(standingsFixture);
assert.equal(standings.season, "2024");
assert.equal(standings.standings.length, 2);
assert.equal(standings.standings[0].name, "Max Verstappen");
assert.equal(standings.standings[0].team, "Red Bull");
assert.equal(standings.standings[0].points, 437);
assert.equal(standings.standings[1].code, "NOR");

const race = parseLastRace(raceFixture);
assert.ok(race);
assert.equal(race.name, "Abu Dhabi Grand Prix");
assert.equal(race.country, "UAE");
assert.equal(race.results[0].name, "Lando Norris");
assert.equal(race.results[0].time, "1:26:33.291");

// Malformed / empty input must not throw, just degrade gracefully.
assert.equal(parseDriverStandings({}).standings.length, 0);
assert.equal(parseLastRace({}), null);

console.log("f1 self-check passed: standings + last race parsing OK");
