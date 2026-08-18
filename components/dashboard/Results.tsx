"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import type { ClassificationRow } from "@/lib/openf1";
import { Stagger, staggerItem } from "@/components/primitives";
import SectionHead from "./SectionHead";

function Headshot({ row }: { row: ClassificationRow }) {
  const { driver } = row;
  if (driver.headshot) {
    return <img src={driver.headshot} alt={driver.fullName} className="pod-face" />;
  }
  return <div className="pod-face pod-face--fallback">{driver.acronym}</div>;
}

export default function Results() {
  const { bundle, highlight, setHighlight, meta } = useDashboard();
  const listRef = useRef<HTMLDivElement>(null);

  // Search jump: pulse the row, then release the highlight.
  useEffect(() => {
    if (highlight == null) return;
    const timer = setTimeout(() => setHighlight(null), 3200);
    return () => clearTimeout(timer);
  }, [highlight, setHighlight]);

  const rows = bundle?.classification ?? [];
  if (!rows.length) return null;

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);
  const hasPoints = rows.some((r) => r.points != null && r.points > 0);

  return (
    <section className="section" id="results">
      <SectionHead
        eyebrow={`Final Classification · ${meta?.sessionName ?? ""}`}
        title="Who took the flag"
        lead="Running order with gaps and points, straight from the timing feed."
      />

      <div className="podium">
        {order.map((row) => {
          const isWinner = row.position === 1;
          return (
            <motion.div
              key={row.driver.number}
              className={`pod pod--p${row.position}${highlight === row.driver.number ? " row--flash" : ""}`}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: isWinner ? 0.15 : 0 }}
              whileHover={{ y: -8 }}
              style={{ ["--tc" as string]: `#${row.driver.colour}` }}
            >
              <div className="pod-top">
                <span className="pod-rank mono">P{row.position}</span>
                <span className="pod-gap mono">{row.gap ?? ""}</span>
              </div>
              <Headshot row={row} />
              <div className="pod-acr">{row.driver.acronym}</div>
              <div className="pod-name">{row.driver.fullName.replace(/\s+[A-Z]+$/, "")}</div>
              <div className="pod-team">{row.driver.team}</div>
              {row.points != null && row.points > 0 && (
                <div className="pod-points mono">+{row.points} pts</div>
              )}
              <motion.div
                className="pod-bar"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </motion.div>
          );
        })}
      </div>

      <Stagger className="grid-list" gap={0.04}>
        <div ref={listRef} />
        {rest.map((row) => (
          <motion.div
            key={row.driver.number}
            className={`row${highlight === row.driver.number ? " row--flash" : ""}`}
            variants={staggerItem}
            whileHover={{ x: 6 }}
            style={{ ["--tc" as string]: `#${row.driver.colour}` }}
          >
            <span className="row-pos mono">{row.position || "–"}</span>
            <span className="row-accent" />
            <span className="row-acr mono">{row.driver.acronym}</span>
            <span className="row-name">{row.driver.fullName.replace(/\s+[A-Z]+$/, "")}</span>
            <span className="row-team">{row.driver.team}</span>
            <span className="row-gap mono">{row.gap ?? ""}</span>
            {hasPoints && (
              <span className="row-points mono">{row.points ? `+${row.points}` : ""}</span>
            )}
          </motion.div>
        ))}
      </Stagger>
    </section>
  );
}
