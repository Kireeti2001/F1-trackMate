"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { Reveal } from "@/components/primitives";
import SectionHead from "./SectionHead";

const FLAG_TINT: Record<string, string> = {
  GREEN: "#39d98a",
  YELLOW: "#ffd447",
  "DOUBLE YELLOW": "#ffd447",
  RED: "#ff3b3b",
  BLUE: "#3aa0ff",
  CHEQUERED: "#eef0f4",
  BLACK: "#8b8ba3",
  "BLACK AND WHITE": "#eef0f4",
};

export default function RaceControl() {
  const { bundle } = useDashboard();
  const msgs = useMemo(() => bundle?.raceControl ?? [], [bundle]);
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(false);

  const categories = useMemo(
    () => ["All", ...new Set(msgs.map((m) => m.category))],
    [msgs],
  );
  const filtered = useMemo(
    () => (filter === "All" ? msgs : msgs.filter((m) => m.category === filter)),
    [msgs, filter],
  );
  const visible = expanded ? filtered : filtered.slice(0, 12);

  if (!msgs.length) return null;

  return (
    <section className="section" id="racecontrol">
      <SectionHead
        eyebrow={`Race Control · ${msgs.length} messages`}
        title="The stewards' story"
        lead="Flags, safety cars, investigations and decisions as they were issued."
      >
        <div className="filter-chips">
          {categories.map((c) => (
            <button
              key={c}
              className={`toggle-chip${filter === c ? " toggle-chip--on" : ""}`}
              onClick={() => { setFilter(c); setExpanded(false); }}
              data-cursor="link"
              aria-pressed={filter === c}
            >
              {c}
            </button>
          ))}
        </div>
      </SectionHead>

      <Reveal delay={0.1} className="card rc-feed" as="div">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((m, i) => {
            const tint = (m.flag && FLAG_TINT[m.flag]) || (m.category === "SafetyCar" ? "#ffa447" : "#55556a");
            return (
              <motion.div
                key={`${m.date}-${m.message.slice(0, 24)}`}
                className="rc-item"
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
              >
                <span className="rc-tick" style={{ background: tint, boxShadow: `0 0 14px ${tint}` }} />
                <div className="rc-body">
                  <p>{m.message}</p>
                  <span className="mono">
                    {m.lap ? `LAP ${m.lap}` : m.category.toUpperCase()}
                    {m.date ? ` · ${new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
                  </span>
                </div>
                <span className="rc-cat mono">{m.category}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length > 12 && (
          <button className="rc-more" onClick={() => setExpanded((v) => !v)} data-cursor="link">
            {expanded ? "Show fewer" : `Show all ${filtered.length} messages`}
          </button>
        )}
      </Reveal>
    </section>
  );
}
