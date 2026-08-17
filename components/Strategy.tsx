"use client";

import { motion } from "motion/react";
import type { DriverStints } from "@/lib/openf1";
import { Reveal } from "./primitives";

const COMPOUND: Record<string, { color: string; short: string }> = {
  SOFT: { color: "#ff3b3b", short: "S" },
  MEDIUM: { color: "#ffd447", short: "M" },
  HARD: { color: "#eef0f4", short: "H" },
  INTERMEDIATE: { color: "#3fd07d", short: "I" },
  WET: { color: "#3aa0ff", short: "W" },
  UNKNOWN: { color: "#6a6a80", short: "?" },
};

export default function Strategy({ strategy }: { strategy: DriverStints }) {
  const total = strategy.totalLaps || 1;
  return (
    <section className="section" id="strategy">
      <Reveal>
        <p className="eyebrow">Tyre Strategy</p>
        <h2 className="section-title">How the win was built</h2>
        <p className="section-lead">
          {strategy.driver.fullName.replace(/\s+[A-Z]+$/, "")}&rsquo;s compound timeline across the race distance.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="strat card">
        <div className="strat-track">
          {strategy.stints.map((s, i) => {
            const c = COMPOUND[s.compound] ?? COMPOUND.UNKNOWN;
            const laps = s.lapEnd - s.lapStart + 1;
            const width = (laps / total) * 100;
            return (
              <motion.div
                key={i}
                className="strat-seg"
                style={{ ["--cc" as string]: c.color }}
                initial={{ width: "0%" }}
                whileInView={{ width: `${width}%` }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.14 }}
              >
                <span className="strat-badge">{c.short}</span>
                <span className="strat-info">
                  <b>{s.compound === "UNKNOWN" ? "Unknown" : s.compound}</b>
                  <em className="mono">
                    L{s.lapStart}&ndash;{s.lapEnd} · {laps} laps
                  </em>
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="strat-axis mono">
          <span>Lap 1</span>
          <span>Lap {total}</span>
        </div>
      </Reveal>
    </section>
  );
}
