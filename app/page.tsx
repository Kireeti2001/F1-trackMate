import { getRaceData } from "@/lib/openf1";
import Hero from "@/components/Hero";
import Classification from "@/components/Classification";
import Telemetry from "@/components/Telemetry";
import RacePace from "@/components/RacePace";
import Strategy from "@/components/Strategy";
import Weather from "@/components/Weather";

export const revalidate = 3600;

export default async function Home() {
  let data;
  try {
    data = await getRaceData();
  } catch (err) {
    return (
      <main>
        <div className="notice">
          <h1>F1 TrackMate</h1>
          <p>Could not reach the OpenF1 timing feed: {err instanceof Error ? err.message : "unknown error"}.</p>
        </div>
      </main>
    );
  }

  const accent = data.classification[0]?.driver.colour ?? "e10600";

  return (
    <main>
      <Hero session={data.session} accent={accent} />
      {data.classification.length > 0 && <Classification rows={data.classification} />}
      {data.fastestLap && data.fastestLap.samples.length > 1 && <Telemetry lap={data.fastestLap} />}
      {data.pace.length > 0 && <RacePace pace={data.pace} />}
      {data.strategy && data.strategy.stints.length > 0 && <Strategy strategy={data.strategy} />}
      {data.weather && <Weather weather={data.weather} />}
      <footer className="footer">
        <span>
          {data.session.officialName || data.session.meetingName} · {data.session.sessionName}
        </span>
        <span>
          Data:{" "}
          <a href="https://openf1.org" target="_blank" rel="noreferrer">
            OpenF1
          </a>
        </span>
      </footer>
    </main>
  );
}
