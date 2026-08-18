"use client";

import { useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { DashboardProvider, useDashboard } from "@/lib/dashboard";
import Cursor from "./Cursor";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Overview from "./Overview";
import Results from "./Results";
import Positions from "./Positions";
import Pace from "./Pace";
import Telemetry from "@/components/Telemetry";
import StrategyAll from "./StrategyAll";
import PitStops from "./PitStops";
import Radio from "./Radio";
import RaceControl from "./RaceControl";
import WeatherSection from "./WeatherSection";
import Calendar from "./Calendar";

function Splash({ label }: { label: string }) {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
    >
      <div className="splash-lights" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.i
            key={i}
            initial={{ opacity: 0.12 }}
            animate={{ opacity: [0.12, 1, 0.12] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
      <p className="mono">{label}</p>
    </motion.div>
  );
}

function Shell() {
  const { bundle, loading, error, meta } = useDashboard();
  // Collapse preference persists across visits; guarded for prerendering.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("trackmate-sidebar") === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => {
      localStorage.setItem("trackmate-sidebar", v ? "0" : "1");
      return !v;
    });
  };

  return (
    <div className="dash">
      <Cursor />
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden />}

      <div className="dash-main">
        <Topbar onToggleSidebar={toggleSidebar} />

        <AnimatePresence>{loading && <Splash label={meta ? `LOADING ${meta.meetingName.toUpperCase()}…` : "CONNECTING TO TIMING FEED…"} />}</AnimatePresence>

        {error && !bundle && (
          <div className="notice">
            <h1>TrackMate</h1>
            <p>Could not reach the OpenF1 timing feed: {error}</p>
          </div>
        )}

        {bundle && (
          <motion.main
            key={meta?.sessionKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Overview />
            <Results />
            <Positions />
            <Pace />
            {bundle.fastestLap && bundle.fastestLap.samples.length > 1 && (
              <Telemetry lap={bundle.fastestLap} />
            )}
            <StrategyAll />
            <PitStops />
            <Radio />
            <RaceControl />
            <WeatherSection />
            <Calendar />
            <footer className="footer">
              <span>
                {meta?.officialName || meta?.meetingName} · {meta?.sessionName}
              </span>
              <span>
                Data:{" "}
                <a href="https://openf1.org" target="_blank" rel="noreferrer" data-cursor="link">
                  OpenF1
                </a>
              </span>
            </footer>
          </motion.main>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <Shell />
    </DashboardProvider>
  );
}
