"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import type { FastestLap, TelemetrySample } from "@/lib/openf1";
import { CountUp, Reveal } from "./primitives";

const W = 1000;
const H = 300;
const H2 = 120;
const PAD_TOP = 16;

function formatLap(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

function buildScale(samples: TelemetrySample[]) {
  const maxT = samples.length ? samples[samples.length - 1].t : 1;
  const maxSpeed = Math.max(1, ...samples.map((s) => s.speed));
  const speedTop = Math.ceil(maxSpeed / 20) * 20;
  const x = (t: number) => (t / maxT) * W;
  const ySpeed = (v: number) => PAD_TOP + (1 - v / speedTop) * (H - PAD_TOP);
  return { maxT, speedTop, x, ySpeed };
}

function linePath(samples: TelemetrySample[], x: (t: number) => number, y: (v: number) => number, val: (s: TelemetrySample) => number) {
  return samples.map((s, i) => `${i === 0 ? "M" : "L"}${x(s.t).toFixed(1)},${y(val(s)).toFixed(1)}`).join(" ");
}

// Contiguous [t0, t1] windows where DRS is active.
function drsZones(samples: TelemetrySample[]): Array<[number, number]> {
  const zones: Array<[number, number]> = [];
  let start: number | null = null;
  for (let i = 0; i < samples.length; i++) {
    const on = samples[i].drs;
    if (on && start === null) start = samples[i].t;
    if (!on && start !== null) {
      zones.push([start, samples[i].t]);
      start = null;
    }
  }
  if (start !== null) zones.push([start, samples[samples.length - 1].t]);
  return zones;
}

export default function Telemetry({ lap }: { lap: FastestLap }) {
  const accent = `#${lap.driver.colour}`;
  const { samples } = lap;

  const { speedTop, x, ySpeed, speedPath, zones, throttleArea, brakeArea } = useMemo(() => {
    const sc = buildScale(samples);
    const yPct = (v: number) => 4 + (1 - v / 100) * (H2 - 8);
    const throttlePath = linePath(samples, sc.x, yPct, (s) => s.throttle);
    const brakePath = linePath(samples, sc.x, yPct, (s) => s.brake);
    return {
      ...sc,
      speedPath: linePath(samples, sc.x, sc.ySpeed, (s) => s.speed),
      throttleArea: `${throttlePath} L${W},${H2} L0,${H2} Z`,
      brakeArea: `${brakePath} L${W},${H2} L0,${H2} Z`,
      zones: drsZones(samples),
    };
  }, [samples]);

  const areaPath = `${speedPath} L${W},${H} L0,${H} Z`;
  const gridSpeeds = [0, 100, 200, 300].filter((v) => v <= speedTop);

  return (
    <section className="section" id="telemetry">
      <Reveal>
        <p className="eyebrow">Fastest Lap · Telemetry</p>
        <h2 className="section-title">The quickest lap, decoded</h2>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="tel-head">
          <div className="tel-driver" style={{ ["--tc" as string]: accent }}>
            <span className="tel-acr mono">{lap.driver.acronym}</span>
            <span className="tel-name">{lap.driver.fullName.replace(/\s+[A-Z]+$/, "")}</span>
            <span className="tel-team">{lap.driver.team}</span>
          </div>
          <div className="tel-stats">
            <div className="tel-stat">
              <span className="tel-stat-label">Lap Time</span>
              <span className="tel-stat-val mono" style={{ color: accent }}>
                {formatLap(lap.lapTime)}
              </span>
            </div>
            <div className="tel-stat">
              <span className="tel-stat-label">Top Speed</span>
              <span className="tel-stat-val">
                <CountUp value={lap.topSpeed} suffix=" km/h" />
              </span>
            </div>
            <div className="tel-stat">
              <span className="tel-stat-label">Lap</span>
              <span className="tel-stat-val mono">#{lap.lapNumber}</span>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="tel-chart card">
        <div className="tel-chart-label mono">SPEED · km/h</div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="tel-svg">
          <defs>
            <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.38" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="speedStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
              <stop offset="50%" stopColor={accent} stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {gridSpeeds.map((v) => (
            <g key={v}>
              <line x1="0" x2={W} y1={ySpeed(v)} y2={ySpeed(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x="6" y={ySpeed(v) - 4} fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace">
                {v}
              </text>
            </g>
          ))}

          {zones.map(([t0, t1], i) => (
            <motion.rect
              key={i}
              x={x(t0)}
              width={Math.max(2, x(t1) - x(t0))}
              y={PAD_TOP}
              height={H - PAD_TOP}
              fill={accent}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.4, duration: 0.6 }}
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#speedFill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 1 }}
          />
          <motion.path
            d={speedPath}
            fill="none"
            stroke="url(#speedStroke)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />

          <circle r="5" fill="#fff">
            <animateMotion dur="6s" repeatCount="indefinite" path={speedPath} rotate="0" />
          </circle>
        </svg>

        <div className="tel-legend">
          <span><i className="chip" style={{ background: accent, opacity: 0.15 }} /> DRS open</span>
          <span><i className="chip chip-line" style={{ background: "#39d98a" }} /> Throttle</span>
          <span><i className="chip chip-line" style={{ background: "#ff4d4d" }} /> Brake</span>
        </div>

        <div className="tel-chart-label mono">INPUTS · % (throttle / brake)</div>
        <svg viewBox={`0 0 ${W} ${H2}`} preserveAspectRatio="none" className="tel-svg tel-svg--sm">
          <defs>
            <linearGradient id="thrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39d98a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#39d98a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="brkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={throttleArea}
            fill="url(#thrFill)"
            stroke="#39d98a"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <motion.path
            d={brakeArea}
            fill="url(#brkFill)"
            stroke="#ff4d4d"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
          />
        </svg>
      </Reveal>
    </section>
  );
}
