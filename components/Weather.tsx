"use client";

import { motion } from "motion/react";
import type { Weather as WeatherData } from "@/lib/openf1";
import { CountUp, Reveal, Stagger, staggerItem } from "./primitives";

export default function Weather({ weather }: { weather: WeatherData }) {
  const tiles = [
    { label: "Track Temp", value: weather.trackTemperature, decimals: 1, suffix: "°C", tint: "#ff7a3c" },
    { label: "Air Temp", value: weather.airTemperature, decimals: 1, suffix: "°C", tint: "#3aa0ff" },
    { label: "Humidity", value: weather.humidity, decimals: 0, suffix: "%", tint: "#39d98a" },
    { label: "Wind", value: weather.windSpeed, decimals: 1, suffix: " m/s", tint: "#b47bff" },
    { label: "Pressure", value: weather.pressure, decimals: 0, suffix: " mbar", tint: "#f4d03f" },
  ];

  return (
    <section className="section" id="weather">
      <Reveal>
        <p className="eyebrow">Conditions</p>
        <h2 className="section-title">Trackside at the flag</h2>
      </Reveal>

      <Stagger className="grid-tiles" gap={0.08}>
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
    </section>
  );
}
