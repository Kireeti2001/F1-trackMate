"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";

export const NAV = [
  { id: "overview", label: "Overview", icon: "M3 12l7-9 3 5 3-3 5 7M3 12v7h18v-7" },
  { id: "results", label: "Classification", icon: "M8 21h8M12 17v4M5 3h14v4a7 7 0 01-14 0V3zM5 5H3v2a4 4 0 004 4M19 5h2v2a4 4 0 01-4 4" },
  { id: "positions", label: "Position Battle", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  { id: "pace", label: "Race Pace", icon: "M12 3a9 9 0 109 9M12 3v9l6-4" },
  { id: "telemetry", label: "Telemetry", icon: "M2 12h4l3-8 4 16 3-8h6" },
  { id: "strategy", label: "Tyre Strategy", icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 15a3 3 0 100-6 3 3 0 000 6zM12 3v3M12 18v3M3 12h3M18 12h3" },
  { id: "pitstops", label: "Pit Stops", icon: "M4 20V8l8-5 8 5v12M4 14h16M9 20v-6M15 20v-6" },
  { id: "radio", label: "Team Radio", icon: "M4 10v4M8 6v12M12 3v18M16 6v12M20 10v4" },
  { id: "racecontrol", label: "Race Control", icon: "M5 21V4h14l-3 5 3 5H5" },
  { id: "weather", label: "Conditions", icon: "M17 18a4 4 0 000-8 6 6 0 00-11.5-1.5A4.5 4.5 0 007 18h10z" },
  { id: "calendar", label: "Season", icon: "M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4" },
] as const;

function useScrollSpy(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onNavigate,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const { live, meta } = useDashboard();
  const active = useScrollSpy(NAV.map((n) => n.id));

  return (
    <motion.aside
      className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}
      animate={{ width: collapsed ? 76 : 252 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <a className="sidebar-brand" href="#overview" data-cursor="link" onClick={onNavigate}>
        <span className="sidebar-mark">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M2 15h7l3-6h10M2 15l4 4h5M22 9l-3-4h-6l-2 4" />
          </svg>
        </span>
        {!collapsed && (
          <span className="sidebar-title">
            TrackMate
            <em>Race Intelligence</em>
          </span>
        )}
      </a>

      <nav className="sidebar-nav" aria-label="Dashboard sections">
        {NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`sidebar-link${active === item.id ? " sidebar-link--active" : ""}`}
            data-cursor="link"
            title={item.label}
            onClick={onNavigate}
          >
            {active === item.id && (
              <motion.span
                className="sidebar-link-bg"
                layoutId="nav-active"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className={`status-dot${live ? " status-dot--live" : ""}`} />
        {!collapsed && (
          <span className="sidebar-foot-text">
            {live ? "Session live" : meta ? `${meta.circuit} · ${meta.year}` : "Feed idle"}
          </span>
        )}
      </div>
    </motion.aside>
  );
}
