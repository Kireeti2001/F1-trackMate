"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { Reveal } from "@/components/primitives";
import SectionHead from "./SectionHead";

const W = 1000;
const H = 380;
const PAD = { top: 18, right: 46, bottom: 26, left: 16 };

export default function Positions() {
  const { bundle } = useDashboard();
  const series = useMemo(() => bundle?.positions ?? [], [bundle]);
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  const { lines, maxT, maxPos } = useMemo(() => {
    const maxT = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.t)));
    const maxPos = Math.max(10, ...series.flatMap((s) => s.points.map((p) => p.position)));
    const x = (t: number) => PAD.left + (t / maxT) * (W - PAD.left - PAD.right);
    const y = (pos: number) => PAD.top + ((pos - 1) / (maxPos - 1)) * (H - PAD.top - PAD.bottom);
    const lines = series.map((s) => {
      // Step path: hold position until the next change.
      let d = "";
      s.points.forEach((p, i) => {
        const px = x(p.t).toFixed(1);
        const py = y(p.position).toFixed(1);
        if (i === 0) d += `M${px},${py}`;
        else d += ` H${px} V${py}`;
      });
      d += ` H${x(maxT).toFixed(1)}`;
      return { driver: s.driver, d, endY: y(s.final), final: s.final };
    });
    return { lines, maxT, maxPos };
  }, [series]);

  if (!series.length) return null;

  const toggle = (num: number) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });

  return (
    <section className="section" id="positions">
      <SectionHead
        eyebrow="Position Battle"
        title="Every move on track"
        lead="Track position over the session for the top ten. Click a driver to isolate their race."
      />

      <Reveal delay={0.1} className="card chart-card" as="div">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg" data-cursor="cross" style={{ height: 380 }}>
          {[1, Math.ceil(maxPos / 2), maxPos].map((pos) => {
            const y = PAD.top + ((pos - 1) / (maxPos - 1)) * (H - PAD.top - PAD.bottom);
            return (
              <g key={pos}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                <text x={W - PAD.right + 8} y={y + 4} fill="rgba(255,255,255,0.32)" fontSize="11" fontFamily="monospace">
                  P{pos}
                </text>
              </g>
            );
          })}
          {[0, maxT / 2, maxT].map((t, i) => (
            <text
              key={i}
              x={PAD.left + (t / maxT) * (W - PAD.left - PAD.right)}
              y={H - 6}
              fill="rgba(255,255,255,0.32)"
              fontSize="11"
              fontFamily="monospace"
              textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
            >
              {Math.round(t)} min
            </text>
          ))}
          {lines.map((line, i) => {
            const off = hidden.has(line.driver.number);
            return (
              <motion.path
                key={line.driver.number}
                d={line.d}
                fill="none"
                stroke={`#${line.driver.colour}`}
                strokeWidth={off ? 1 : 2.2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                animate={{ opacity: off ? 0.08 : 1 }}
                transition={{ pathLength: { duration: 1.6, ease: "easeInOut", delay: i * 0.08 } }}
              />
            );
          })}
        </svg>
        <div className="pace-legend">
          {lines.map((line) => (
            <button
              key={line.driver.number}
              className={`pace-chip pace-chip--btn${hidden.has(line.driver.number) ? " pace-chip--off" : ""}`}
              onClick={() => toggle(line.driver.number)}
              data-cursor="link"
            >
              <i style={{ background: `#${line.driver.colour}` }} />
              {line.driver.acronym}
              <b className="mono">P{line.final}</b>
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
