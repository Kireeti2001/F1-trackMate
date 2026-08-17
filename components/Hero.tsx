"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import type { SessionMeta } from "@/lib/openf1";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function Hero({ session, accent }: { session: SessionMeta; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 220]);

  // Cursor-follow glow.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.3);
  const gx = useSpring(mx, { stiffness: 60, damping: 20 });
  const gy = useSpring(my, { stiffness: 60, damping: 20 });
  const glowLeft = useTransform(gx, (v) => `${v * 100}%`);
  const glowTop = useTransform(gy, (v) => `${v * 100}%`);

  const words = session.meetingName.split(" ");

  return (
    <div
      ref={ref}
      className="hero"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
    >
      <motion.div className="hero-aurora" style={{ y: bgY }}>
        <motion.span
          className="blob"
          style={{ background: `#${accent}` }}
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="blob blob-2"
          animate={{ x: [0, -50, 40, 0], y: [0, 30, -40, 0], scale: [1, 0.9, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="blob blob-3"
          animate={{ x: [0, 40, -60, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.span
        className="hero-glow"
        style={{ left: glowLeft, top: glowTop, background: `radial-gradient(circle, #${accent}55, transparent 60%)` }}
      />

      {session.circuitImage ? (
        <motion.img
          src={session.circuitImage}
          alt=""
          aria-hidden
          className="hero-circuit"
          style={{ y: bgY }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      ) : null}

      <motion.div className="hero-inner" style={{ y: titleY, opacity: titleOpacity }}>
        <motion.p
          className="hero-eyebrow mono"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {session.year} · {session.sessionName.toUpperCase()} · {formatDate(session.date)}
        </motion.p>

        <h1 className="hero-title">
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className="hero-word">
              <motion.span
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          className="hero-meta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + words.length * 0.08 + 0.2, duration: 0.7 }}
        >
          {session.flag ? <img src={session.flag} alt={session.country} className="hero-flag" /> : null}
          <span>{session.circuit}</span>
          <span className="dot" />
          <span>{session.country}</span>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        <span className="mono">SCROLL</span>
        <motion.span
          className="hero-scroll-line"
          animate={{ scaleY: [0.2, 1, 0.2], originY: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
