"use client";

import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { Reveal, Stagger, staggerItem } from "@/components/primitives";
import SectionHead from "./SectionHead";

const COMPOUND: Record<string, string> = {
  SOFT: "#ff3b3b",
  MEDIUM: "#ffd447",
  HARD: "#eef0f4",
  INTERMEDIATE: "#3fd07d",
  WET: "#3aa0ff",
  UNKNOWN: "#6a6a80",
};

export default function StrategyAll() {
  const { bundle } = useDashboard();
  const stints = bundle?.stints ?? [];
  if (!stints.length) return null;

  const total = Math.max(1, ...stints.map((d) => d.totalLaps));

  return (
    <section className="section" id="strategy">
      <SectionHead
        eyebrow="Tyre Strategy"
        title="Every compound call"
        lead="Stint timelines for the whole field in finishing order. Hover a stint for the detail."
      />

      <Reveal delay={0.1} className="card strat-board" as="div">
        <Stagger gap={0.03}>
          {stints.map((d) => (
            <motion.div key={d.driver.number} className="strat-row" variants={staggerItem}>
              <span className="strat-row-name mono" style={{ color: `#${d.driver.colour}` }}>
                {d.driver.acronym}
              </span>
              <div className="strat-row-track">
                {d.stints.map((s, i) => {
                  const laps = s.lapEnd - s.lapStart + 1;
                  const left = ((s.lapStart - 1) / total) * 100;
                  const width = (laps / total) * 100;
                  const color = COMPOUND[s.compound] ?? COMPOUND.UNKNOWN;
                  return (
                    <motion.span
                      key={i}
                      className="strat-row-seg"
                      style={{ left: `${left}%`, background: color }}
                      title={`${d.driver.acronym} · ${s.compound} · L${s.lapStart}–${s.lapEnd} (${laps} laps)`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${width}%` }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.08 }}
                      data-cursor="link"
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </Stagger>
        <div className="strat-axis mono">
          <span>Lap 1</span>
          <span>Lap {total}</span>
        </div>
        <div className="pace-legend strat-legend">
          {Object.entries(COMPOUND)
            .filter(([k]) => k !== "UNKNOWN")
            .map(([name, color]) => (
              <span key={name} className="pace-chip">
                <i style={{ background: color }} />
                {name.charAt(0) + name.slice(1).toLowerCase()}
              </span>
            ))}
        </div>
      </Reveal>
    </section>
  );
}
