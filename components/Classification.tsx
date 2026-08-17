"use client";

import { motion } from "motion/react";
import type { ClassificationRow } from "@/lib/openf1";
import { Reveal, Stagger, staggerItem } from "./primitives";

function Headshot({ row }: { row: ClassificationRow }) {
  const { driver } = row;
  if (driver.headshot) {
    return <img src={driver.headshot} alt={driver.fullName} className="pod-face" />;
  }
  return <div className="pod-face pod-face--fallback">{driver.acronym}</div>;
}

export default function Classification({ rows }: { rows: ClassificationRow[] }) {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  // Visual order: 2nd, 1st, 3rd.
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <section className="section" id="classification">
      <Reveal>
        <p className="eyebrow">Final Classification</p>
        <h2 className="section-title">Who took the flag</h2>
        <p className="section-lead">
          Final running order for the session, straight from the timing feed.
        </p>
      </Reveal>

      <div className="podium">
        {order.map((row) => {
          const isWinner = row.position === 1;
          return (
            <motion.div
              key={row.driver.number}
              className={`pod pod--p${row.position}`}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: isWinner ? 0.15 : 0 }}
              whileHover={{ y: -8 }}
              style={{ ["--tc" as string]: `#${row.driver.colour}` }}
            >
              <div className="pod-rank mono">P{row.position}</div>
              <Headshot row={row} />
              <div className="pod-acr">{row.driver.acronym}</div>
              <div className="pod-name">{row.driver.fullName.replace(/\s+[A-Z]+$/, "")}</div>
              <div className="pod-team">{row.driver.team}</div>
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

      <Stagger className="grid-list" gap={0.05}>
        {rest.map((row) => (
          <motion.div
            key={row.driver.number}
            className="row"
            variants={staggerItem}
            whileHover={{ x: 6 }}
            style={{ ["--tc" as string]: `#${row.driver.colour}` }}
          >
            <span className="row-pos mono">{row.position}</span>
            <span className="row-accent" />
            <span className="row-acr mono">{row.driver.acronym}</span>
            <span className="row-name">{row.driver.fullName.replace(/\s+[A-Z]+$/, "")}</span>
            <span className="row-team">{row.driver.team}</span>
          </motion.div>
        ))}
      </Stagger>
    </section>
  );
}
