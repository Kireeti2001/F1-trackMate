"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import type { DriverLaps } from "@/lib/openf1";
import { Reveal } from "./primitives";

const W = 1000;
const H = 340;
const PAD = 24;

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export default function RacePace({ pace }: { pace: DriverLaps[] }) {
  const { lines, lapMin, lapMax, tMin, tMax, x, y } = useMemo(() => {
    const all = pace.flatMap((d) => d.laps);
    const laps = all.map((l) => l.lap);
    const times = all.map((l) => l.time);
    const lapMin = Math.min(...laps);
    const lapMax = Math.max(...laps);
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const x = (lap: number) => PAD + ((lap - lapMin) / Math.max(1, lapMax - lapMin)) * (W - 2 * PAD);
    // Faster laps sit higher on the chart.
    const y = (t: number) => PAD + ((t - tMin) / Math.max(0.001, tMax - tMin)) * (H - 2 * PAD);
    const lines = pace.map((d) => ({
      driver: d.driver,
      d: d.laps.map((l, i) => `${i === 0 ? "M" : "L"}${x(l.lap).toFixed(1)},${y(l.time).toFixed(1)}`).join(" "),
    }));
    return { lines, lapMin, lapMax, tMin, tMax, x, y };
  }, [pace]);

  const ticks = [tMin, (tMin + tMax) / 2, tMax];

  return (
    <section className="section" id="pace">
      <Reveal>
        <p className="eyebrow">Race Pace</p>
        <h2 className="section-title">Lap-by-lap battle</h2>
        <p className="section-lead">
          Clean-air lap times for the top five, pit and safety-car laps filtered out. Higher is faster.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="pace-chart card">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="pace-svg">
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={PAD} x2={W - PAD} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
              <text x={PAD} y={y(t) - 5} fill="rgba(255,255,255,0.32)" fontSize="11" fontFamily="monospace">
                {fmt(t)}
              </text>
            </g>
          ))}
          {[lapMin, Math.round((lapMin + lapMax) / 2), lapMax].map((lap, i) => (
            <text
              key={i}
              x={x(lap)}
              y={H - 6}
              fill="rgba(255,255,255,0.32)"
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
            >
              L{lap}
            </text>
          ))}
          {lines.map((line, i) => (
            <motion.path
              key={line.driver.number}
              d={line.d}
              fill="none"
              stroke={`#${line.driver.colour}`}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: "easeInOut", delay: i * 0.15 }}
            />
          ))}
        </svg>

        <div className="pace-legend">
          {pace.map((d) => (
            <span key={d.driver.number} className="pace-chip">
              <i style={{ background: `#${d.driver.colour}` }} />
              {d.driver.acronym}
              <b className="mono">{fmt(d.fastest)}</b>
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
