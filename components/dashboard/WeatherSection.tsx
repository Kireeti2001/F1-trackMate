"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { CountUp, Reveal, Stagger, staggerItem } from "@/components/primitives";
import SectionHead from "./SectionHead";

const W = 1000;
const H = 180;
const PAD = 20;

export default function WeatherSection() {
  const { bundle } = useDashboard();
  const weather = bundle?.weather;
  const series = useMemo(() => bundle?.weatherSeries ?? [], [bundle]);

  const chart = useMemo(() => {
    if (series.length < 2) return null;
    const maxT = series[series.length - 1].t || 1;
    const temps = series.flatMap((p) => [p.track, p.air]);
    const lo = Math.floor(Math.min(...temps)) - 2;
    const hi = Math.ceil(Math.max(...temps)) + 2;
    const x = (t: number) => PAD + (t / maxT) * (W - 2 * PAD);
    const y = (v: number) => PAD + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - 2 * PAD);
    const path = (val: (p: (typeof series)[number]) => number) =>
      series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(val(p)).toFixed(1)}`).join(" ");
    return { track: path((p) => p.track), air: path((p) => p.air), lo, hi, y };
  }, [series]);

  if (!weather) return null;

  const tiles = [
    { label: "Track Temp", value: weather.trackTemperature, decimals: 1, suffix: "°C", tint: "#ff7a3c" },
    { label: "Air Temp", value: weather.airTemperature, decimals: 1, suffix: "°C", tint: "#3aa0ff" },
    { label: "Humidity", value: weather.humidity, decimals: 0, suffix: "%", tint: "#39d98a" },
    { label: "Wind", value: weather.windSpeed, decimals: 1, suffix: " m/s", tint: "#b47bff" },
    { label: "Rainfall", value: weather.rainfall, decimals: 0, suffix: " mm", tint: "#4dc6ff" },
    { label: "Pressure", value: weather.pressure, decimals: 0, suffix: " mbar", tint: "#f4d03f" },
  ];

  return (
    <section className="section" id="weather">
      <SectionHead
        eyebrow="Conditions"
        title="Trackside atmosphere"
        lead="Latest trackside readings, plus how the temperatures evolved across the session."
      />

      <Stagger className="grid-tiles" gap={0.07}>
        {tiles.map((t) => (
          <motion.div
            key={t.label}
            className="wx-tile card"
            variants={staggerItem}
            whileHover={{ y: -6 }}
            style={{ ["--tint" as string]: t.tint }}
          >
            <span className="wx-label">{t.label}</span>
            <span className="wx-value">
              <CountUp value={t.value} decimals={t.decimals} suffix={t.suffix} />
            </span>
            <span className="wx-glow" />
          </motion.div>
        ))}
      </Stagger>

      {chart && (
        <Reveal delay={0.1} className="card chart-card wx-chart" as="div">
          <div className="tel-chart-label mono">TEMPERATURE · °C OVER SESSION</div>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg" style={{ height: 180 }}>
            {[chart.lo, (chart.lo + chart.hi) / 2, chart.hi].map((v, i) => (
              <g key={i}>
                <line x1={PAD} x2={W - PAD} y1={chart.y(v)} y2={chart.y(v)} stroke="rgba(255,255,255,0.06)" />
                <text x={PAD} y={chart.y(v) - 4} fill="rgba(255,255,255,0.32)" fontSize="11" fontFamily="monospace">
                  {Math.round(v)}°
                </text>
              </g>
            ))}
            <motion.path
              d={chart.track}
              fill="none" stroke="#ff7a3c" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
            <motion.path
              d={chart.air}
              fill="none" stroke="#3aa0ff" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
            />
          </svg>
          <div className="pace-legend">
            <span className="pace-chip"><i style={{ background: "#ff7a3c" }} />Track</span>
            <span className="pace-chip"><i style={{ background: "#3aa0ff" }} />Air</span>
          </div>
        </Reveal>
      )}
    </section>
  );
}
