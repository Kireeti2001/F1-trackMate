"use client";

import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { CountUp, Reveal, Stagger, staggerItem } from "@/components/primitives";
import SectionHead from "./SectionHead";

export default function PitStops() {
  const { bundle } = useDashboard();
  const pits = bundle?.pits ?? [];
  if (!pits.length) return null;

  const fastest = pits[0];
  const slowest = pits[pits.length - 1].duration;
  const avg = pits.reduce((sum, p) => sum + p.duration, 0) / pits.length;

  return (
    <section className="section" id="pitstops">
      <SectionHead
        eyebrow="Pit Lane"
        title="The stopwatch war"
        lead="Every pit-lane visit, ranked by total pit-lane time — entry to exit."
      />

      <Stagger className="grid-tiles pit-tiles" gap={0.08}>
        <motion.div className="card wx-tile" variants={staggerItem} whileHover={{ y: -6 }} style={{ ["--tint" as string]: `#${fastest.driver.colour}` }}>
          <span className="wx-label">Fastest Stop · {fastest.driver.acronym}</span>
          <span className="wx-value"><CountUp value={fastest.duration} decimals={1} suffix="s" /></span>
          <span className="wx-glow" />
        </motion.div>
        <motion.div className="card wx-tile" variants={staggerItem} whileHover={{ y: -6 }} style={{ ["--tint" as string]: "#b47bff" }}>
          <span className="wx-label">Average</span>
          <span className="wx-value"><CountUp value={avg} decimals={1} suffix="s" /></span>
          <span className="wx-glow" />
        </motion.div>
        <motion.div className="card wx-tile" variants={staggerItem} whileHover={{ y: -6 }} style={{ ["--tint" as string]: "#3aa0ff" }}>
          <span className="wx-label">Total Stops</span>
          <span className="wx-value"><CountUp value={pits.length} decimals={0} /></span>
          <span className="wx-glow" />
        </motion.div>
      </Stagger>

      <Reveal delay={0.1} className="card pit-board" as="div">
        {pits.map((p, i) => (
          <div key={`${p.driver.number}-${p.lap}-${i}`} className="pit-row">
            <span className="pit-rank mono">{i + 1}</span>
            <span className="pit-acr mono" style={{ color: `#${p.driver.colour}` }}>{p.driver.acronym}</span>
            <span className="pit-lap mono">L{p.lap}</span>
            <div className="pit-bar-track">
              <motion.div
                className="pit-bar"
                style={{ background: `#${p.driver.colour}` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(p.duration / slowest) * 100}%` }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.04, 0.6) }}
              />
            </div>
            <span className="pit-time mono">{p.duration.toFixed(1)}s</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
