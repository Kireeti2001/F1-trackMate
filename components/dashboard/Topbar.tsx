"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDashboard, YEARS } from "@/lib/dashboard";
import type { RaceControlMsg } from "@/lib/openf1";

function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return ref;
}

const pop = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
};

function flagTint(msg: RaceControlMsg): string {
  switch (msg.flag) {
    case "GREEN": return "#39d98a";
    case "YELLOW": case "DOUBLE YELLOW": return "#ffd447";
    case "RED": return "#ff3b3b";
    case "BLUE": return "#3aa0ff";
    case "CHEQUERED": return "#eef0f4";
    default: return msg.category === "SafetyCar" ? "#ffa447" : "#8b8ba3";
  }
}

function readKey(sk: number) {
  return `trackmate-read-${sk}`;
}

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const {
    year, meetings, meeting, sessions, session, meta, live, bundle,
    setYear, selectMeeting, selectSession, setHighlight,
  } = useDashboard();

  // --- Search -------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useDismiss(() => setSearchOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { drivers: [], meetings: [] };
    return {
      drivers: (bundle?.drivers ?? [])
        .filter((d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.acronym.toLowerCase().includes(q) ||
          d.team.toLowerCase().includes(q) ||
          String(d.number) === q)
        .slice(0, 5),
      meetings: meetings
        .filter((m) =>
          m.name.toLowerCase().includes(q) ||
          m.circuit.toLowerCase().includes(q) ||
          m.country.toLowerCase().includes(q))
        .slice(0, 4),
    };
  }, [query, bundle, meetings]);

  const jumpToDriver = (num: number) => {
    setHighlight(num);
    setSearchOpen(false);
    setQuery("");
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Notifications (race control) ---------------------------------------
  const [notifOpen, setNotifOpen] = useState(false);
  // Read-state lives in localStorage per session; in-memory override avoids a
  // re-read after "mark all read". Safe during hydration: bundle is null then.
  const [read, setRead] = useState<{ key: number; count: number } | null>(null);
  const notifRef = useDismiss(() => setNotifOpen(false));
  const msgs = bundle?.raceControl ?? [];

  const readCount = useMemo(() => {
    if (!session || typeof window === "undefined") return 0;
    if (read && read.key === session.key) return read.count;
    return Number(localStorage.getItem(readKey(session.key))) || 0;
  }, [session, read]);

  const unread = Math.max(0, msgs.length - readCount);
  const markAllRead = () => {
    if (!session) return;
    localStorage.setItem(readKey(session.key), String(msgs.length));
    setRead({ key: session.key, count: msgs.length });
  };

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" data-cursor="link">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 7h16M4 12h10M4 17h16" />
        </svg>
      </button>

      <div className="topbar-picker" role="group" aria-label="Session picker">
        <label className="picker">
          <span>Season</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} data-cursor="link">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="picker picker--wide">
          <span>Grand Prix</span>
          <select value={meeting?.key ?? ""} onChange={(e) => selectMeeting(Number(e.target.value))} data-cursor="link">
            {meetings.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
          </select>
        </label>
        <label className="picker">
          <span>Session</span>
          <select value={session?.key ?? ""} onChange={(e) => selectSession(Number(e.target.value))} data-cursor="link">
            {sessions.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
        </label>
      </div>

      <div className="topbar-right">
        {live && (
          <span className="live-badge" title="Session in progress — data refreshes automatically">
            <i />LIVE
          </span>
        )}

        <div className="search" ref={searchRef}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search drivers, teams, circuits…"
            value={query}
            aria-label="Search drivers, teams and circuits"
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          />
          <AnimatePresence>
            {searchOpen && query.trim().length >= 2 && (
              <motion.div className="dropdown search-results" {...pop}>
                {results.drivers.length === 0 && results.meetings.length === 0 && (
                  <p className="dropdown-empty">No matches for “{query.trim()}”</p>
                )}
                {results.drivers.length > 0 && <p className="dropdown-label">Drivers</p>}
                {results.drivers.map((d) => (
                  <button key={d.number} className="dropdown-row" onClick={() => jumpToDriver(d.number)} data-cursor="link">
                    <i className="swatch" style={{ background: `#${d.colour}` }} />
                    <b>{d.fullName.replace(/\s+[A-Z]+$/, "")}</b>
                    <span className="mono">{d.acronym} · #{d.number}</span>
                    <em>{d.team}</em>
                  </button>
                ))}
                {results.meetings.length > 0 && <p className="dropdown-label">Grands Prix · {year}</p>}
                {results.meetings.map((m) => (
                  <button
                    key={m.key}
                    className="dropdown-row"
                    data-cursor="link"
                    onClick={() => { selectMeeting(m.key); setSearchOpen(false); setQuery(""); }}
                  >
                    <i className="swatch" style={{ background: "var(--accent)" }} />
                    <b>{m.name}</b>
                    <span className="mono">{m.circuit}</span>
                    <em>{m.country}</em>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="notif" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
            data-cursor="link"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 9a6 6 0 10-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9M10.3 20.5a2 2 0 003.4 0" />
            </svg>
            {unread > 0 && <span className="notif-count mono">{unread > 99 ? "99+" : unread}</span>}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div className="dropdown notif-panel" {...pop}>
                <div className="notif-head">
                  <b>Race Control</b>
                  <button onClick={markAllRead} data-cursor="link">Mark all read</button>
                </div>
                <div className="notif-list">
                  {msgs.length === 0 && <p className="dropdown-empty">No messages for this session.</p>}
                  {msgs.slice(0, 14).map((m, i) => (
                    <div key={`${m.date}-${i}`} className={`notif-item${i < unread ? " notif-item--new" : ""}`}>
                      <i style={{ background: flagTint(m) }} />
                      <div>
                        <p>{m.message}</p>
                        <span className="mono">
                          {m.lap ? `LAP ${m.lap} · ` : ""}
                          {m.date ? new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <a className="notif-all" href="#racecontrol" onClick={() => setNotifOpen(false)} data-cursor="link">
                  View full feed ↓
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {meta?.flag && <img src={meta.flag} alt={meta.country} className="topbar-flag" />}
      </div>
    </header>
  );
}
