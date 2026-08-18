"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { formatLapTime } from "@/lib/openf1";
import { CountUp, Reveal, Stagger, staggerItem } from "@/components/primitives";
import SplitTitle from "./SplitTitle";

const TrackMap3D = dynamic(() => import("./TrackMap3D"), { ssr: false });

export default function Overview() {
  const { meta, bundle, live } = useDashboard();
  if (!meta || !bundle) return null;

  const winner = bundle.classification[0];
  const accent = winner ? `#${winner.driver.colour}` : "var(--accent)";
  const fl = bundle.fastestLap;

  const stats = [
    { label: "Race Distance", value: bundle.totalLaps, suffix: " laps", decimals: 0 },
    { label: "Pit Stops", value: bundle.pits.length, suffix: "", decimals: 0 },
    { label: "Top Speed", value: fl?.topSpeed ?? 0, suffix: " km/h", decimals: 0 },
    { label: "Radio Messages", value: bundle.radio.length, suffix: "", decimals: 0 },
  ];

  return (
    <section className="section overview" id="overview">
      <div className="overview-backdrop" style={{ ["--ac" as string]: accent }} aria-hidden />
      <Reveal>
        <p className="eyebrow">
          {live ? "Live now" : "Latest decoded"} · {meta.sessionName} · {meta.year}
        </p>
      </Reveal>
      <SplitTitle text={meta.meetingName} as="h1" className="overview-title" />
      <Reveal delay={0.2}>
        <div className="overview-meta">
          {meta.flag && <img src={meta.flag} alt={meta.country} className="overview-flag" />}
          <span>{meta.circuit}</span>
          <span className="dot" />
          <span>{meta.country}</span>
          <span className="dot" />
          <span className="mono">
            {meta.date
              ? new Date(meta.date).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
              : ""}
          </span>
        </div>
      </Reveal>

      <div className="overview-grid">
        <Reveal delay={0.1} className="card overview-track" as="div">
          {bundle.track.length >= 8 ? (
            <>
              <TrackMap3D points={bundle.track} accent={accent} />
              <div className="overview-track-caption mono">
                CIRCUIT MODEL · BUILT FROM {fl?.driver.acronym ?? "—"}&apos;S FASTEST LAP GPS
              </div>
            </>
          ) : (
            <div className="overview-track-empty">
              <p>No GPS trace available for this session.</p>
            </div>
          )}
        </Reveal>

        <div className="overview-side">
          {winner && (
            <Reveal delay={0.15} className="card overview-winner" as="div">
              <span className="wx-label">{meta.sessionName === "Race" ? "Winner" : "P1"}</span>
              <div className="overview-winner-row" style={{ ["--tc" as string]: accent }}>
                {winner.driver.headshot ? (
                  <img src={winner.driver.headshot} alt={winner.driver.fullName} />
                ) : (
                  <i className="mono">{winner.driver.acronym}</i>
                )}
                <div>
                  <b>{winner.driver.fullName.replace(/\s+[A-Z]+$/, "")}</b>
                  <em>{winner.driver.team}</em>
                </div>
              </div>
              {fl && (
                <div className="overview-fl">
                  <span className="wx-label">Fastest Lap · {fl.driver.acronym}</span>
                  <span className="mono overview-fl-time">{formatLapTime(fl.lapTime)}</span>
                </div>
              )}
            </Reveal>
          )}

          <Stagger className="overview-stats" gap={0.07}>
            {stats.map((s) => (
              <motion.div key={s.label} className="card overview-stat" variants={staggerItem} whileHover={{ y: -4 }}>
                <span className="wx-label">{s.label}</span>
                <span className="overview-stat-val">
                  <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </span>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
