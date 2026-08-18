"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDashboard, YEARS } from "@/lib/dashboard";
import SectionHead from "./SectionHead";

// Season browser with live date-range filtering. Picking a round loads it
// into every panel above.

export default function Calendar() {
  const { year, meetings, meeting, setYear, selectMeeting } = useDashboard();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const d = m.dateStart.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [meetings, from, to]);

  const jump = (key: number) => {
    selectMeeting(key);
    document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="section" id="calendar">
      <SectionHead
        eyebrow={`Season Browser · ${filtered.length} of ${meetings.length} rounds`}
        title="Pick any Grand Prix"
        lead="Filter the calendar by date range, then load any round into the dashboard."
      >
        <div className="cal-controls">
          <div className="filter-chips">
            {YEARS.map((y) => (
              <button
                key={y}
                className={`toggle-chip${year === y ? " toggle-chip--on" : ""}`}
                onClick={() => { setYear(y); setFrom(""); setTo(""); }}
                data-cursor="link"
                aria-pressed={year === y}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="date-range">
            <label>
              <span>From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-cursor="link" />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-cursor="link" />
            </label>
            {(from || to) && (
              <button className="toggle-chip" onClick={() => { setFrom(""); setTo(""); }} data-cursor="link">
                Clear
              </button>
            )}
          </div>
        </div>
      </SectionHead>

      <motion.div className="cal-grid" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => {
            const active = meeting?.key === m.key;
            const date = m.dateStart ? new Date(m.dateStart) : null;
            return (
              <motion.button
                key={m.key}
                layout
                className={`card cal-card${active ? " cal-card--active" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ y: -5 }}
                onClick={() => jump(m.key)}
                data-cursor="link"
              >
                {m.circuitImage && (
                  <img src={m.circuitImage} alt="" className="cal-circuit" loading="lazy" />
                )}
                <span className="cal-date mono">
                  {date
                    ? date.toLocaleDateString([], { day: "2-digit", month: "short" }).toUpperCase()
                    : "TBC"}
                </span>
                <b className="cal-name">{m.name}</b>
                <span className="cal-loc">
                  {m.flag && <img src={m.flag} alt="" />}
                  {m.circuit} · {m.country}
                </span>
                {active && <span className="cal-badge mono">LOADED</span>}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
      {filtered.length === 0 && (
        <p className="dropdown-empty" style={{ padding: "30px 0" }}>
          No rounds inside that date range.
        </p>
      )}
    </section>
  );
}
