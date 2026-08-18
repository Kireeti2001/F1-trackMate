"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { Reveal } from "@/components/primitives";
import SectionHead from "./SectionHead";

const W = 1000;
const H = 340;
const PAD = 24;

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export default function Pace() {
  const { bundle, session } = useDashboard();
  const pace = useMemo(() => bundle?.pace ?? [], [bundle]);
  // Default = five fastest drivers; user picks are scoped to the session so a
  // session switch falls back to the default without any effect-driven reset.
  const [override, setOverride] = useState<{ key: number; nums: number[] } | null>(null);
  const selected = useMemo(
    () =>
      override && override.key === session?.key
        ? override.nums
        : pace.slice(0, 5).map((d) => d.driver.number),
    [override, session, pace],
  );

  const shown = useMemo(
    () => pace.filter((d) => selected.includes(d.driver.number)),
    [pace, selected],
  );

  const { lines, ticks, lapTicks, x, y } = useMemo(() => {
    const all = shown.flatMap((d) => d.laps);
    if (!all.length) {
      return { lines: [], ticks: [] as number[], lapTicks: [] as number[], x: () => 0, y: () => 0 };
    }
    const laps = all.map((l) => l.lap);
    const times = all.map((l) => l.time);
    const lapMin = Math.min(...laps);
    const lapMax = Math.max(...laps);
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const x = (lap: number) => PAD + ((lap - lapMin) / Math.max(1, lapMax - lapMin)) * (W - 2 * PAD);
    const y = (t: number) => PAD + ((t - tMin) / Math.max(0.001, tMax - tMin)) * (H - 2 * PAD);
    const lines = shown.map((d) => ({
      driver: d.driver,
      d: d.laps.map((l, i) => `${i === 0 ? "M" : "L"}${x(l.lap).toFixed(1)},${y(l.time).toFixed(1)}`).join(" "),
    }));
    return {
      lines,
      ticks: [tMin, (tMin + tMax) / 2, tMax],
      lapTicks: [lapMin, Math.round((lapMin + lapMax) / 2), lapMax],
      x,
      y,
    };
  }, [shown]);

  if (!pace.length) return null;

  const toggle = (num: number) => {
    if (!session) return;
    const nums = selected.includes(num) ? selected.filter((n) => n !== num) : [...selected, num];
    setOverride({ key: session.key, nums });
  };

  return (
    <section className="section" id="pace">
      <SectionHead
        eyebrow="Race Pace"
        title="Lap-by-lap battle"
        lead="Clean-air lap times — pit and safety-car laps filtered out. Higher is faster. Toggle any driver into the comparison."
      />

      <Reveal delay={0.05} className="driver-toggles" as="div">
        {pace.map((d) => {
          const on = selected.includes(d.driver.number);
          return (
            <button
              key={d.driver.number}
              className={`toggle-chip${on ? " toggle-chip--on" : ""}`}
              style={{ ["--tc" as string]: `#${d.driver.colour}` }}
              onClick={() => toggle(d.driver.number)}
              data-cursor="link"
              aria-pressed={on}
            >
              {d.driver.acronym}
            </button>
          );
        })}
      </Reveal>

      <Reveal delay={0.1} className="card chart-card" as="div">
        {lines.length === 0 ? (
          <p className="dropdown-empty" style={{ padding: 40 }}>Select at least one driver.</p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg" data-cursor="cross" style={{ height: 340 }}>
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={PAD} x2={W - PAD} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
                <text x={PAD} y={y(t) - 5} fill="rgba(255,255,255,0.32)" fontSize="11" fontFamily="monospace">
                  {fmt(t)}
                </text>
              </g>
            ))}
            {lapTicks.map((lap, i) => (
              <text key={i} x={x(lap)} y={H - 6} fill="rgba(255,255,255,0.32)" fontSize="11" fontFamily="monospace" textAnchor="middle">
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
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: i * 0.08 }}
              />
            ))}
          </svg>
        )}
        <div className="pace-legend">
          {shown.map((d) => (
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
