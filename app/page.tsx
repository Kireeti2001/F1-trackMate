import {
  getDriverStandings,
  getLastRace,
  type DriverStanding,
  type LastRace,
  type StandingsTable,
} from "@/lib/f1";

export const dynamic = "force-dynamic";

function posClass(position: number): string {
  return position <= 3 ? `pos p${position}` : "pos";
}

function StandingsCard({ season, round, standings }: { season: string; round: string; standings: DriverStanding[] }) {
  return (
    <section className="card">
      <h2>
        Driver Standings {season ? `· ${season}` : ""} {round ? `· Round ${round}` : ""}
      </h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Driver</th>
            <th style={{ textAlign: "right" }}>Wins</th>
            <th style={{ textAlign: "right" }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((d) => (
            <tr key={`${d.position}-${d.code || d.name}`}>
              <td className={posClass(d.position)}>{d.position}</td>
              <td>
                <div className="driver">{d.name}</div>
                <div className="team">{d.team}</div>
              </td>
              <td style={{ textAlign: "right" }}>{d.wins}</td>
              <td className="pts">{d.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function LastRaceCard({ race }: { race: LastRace }) {
  const podium = race.results.slice(0, 5);
  return (
    <section className="card">
      <h2>Last Race</h2>
      <div className="driver" style={{ fontSize: 16 }}>
        {race.name}
      </div>
      <div className="race-meta">
        {[race.circuit, race.locality && `${race.locality}, ${race.country}`, race.date].filter(Boolean).join(" · ")}
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Driver</th>
            <th style={{ textAlign: "right" }}>Time / Status</th>
          </tr>
        </thead>
        <tbody>
          {podium.map((r) => (
            <tr key={`${r.position}-${r.code || r.name}`}>
              <td className={posClass(r.position)}>{r.position}</td>
              <td>
                <div className="driver">{r.name}</div>
                <div className="team">{r.team}</div>
              </td>
              <td style={{ textAlign: "right" }} className="team">
                {r.time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function Home() {
  let table: StandingsTable | null = null;
  let race: LastRace | null = null;
  let error: string | null = null;
  try {
    [table, race] = await Promise.all([getDriverStandings(), getLastRace()]);
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown error";
  }

  return (
    <main className="wrap">
      <div className="masthead">
        <span className="mark" aria-hidden />
        <h1>F1 TrackMate</h1>
      </div>
      <p className="sub">Live Formula 1 driver standings and the latest Grand Prix results.</p>
      {error ? (
        <div className="error">Could not load live F1 data: {error}.</div>
      ) : (
        <div className="grid">
          {table && (
            <StandingsCard season={table.season} round={table.round} standings={table.standings} />
          )}
          {race ? (
            <LastRaceCard race={race} />
          ) : (
            <section className="card">
              <h2>Last Race</h2>
              <p className="team">No race results available yet this season.</p>
            </section>
          )}
        </div>
      )}
      <p className="foot">Data from the Jolpica (Ergast-compatible) F1 API · api.jolpi.ca</p>
    </main>
  );
}
