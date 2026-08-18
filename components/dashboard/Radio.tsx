"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useDashboard } from "@/lib/dashboard";
import { Stagger, staggerItem } from "@/components/primitives";
import SectionHead from "./SectionHead";

export default function Radio() {
  const { bundle } = useDashboard();
  const clips = bundle?.radio ?? [];
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  if (!clips.length) return null;

  const toggle = (url: string) => {
    if (playing === url) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.play().catch(() => setPlaying(null));
    audio.onended = () => setPlaying(null);
    audioRef.current = audio;
    setPlaying(url);
  };

  return (
    <section className="section" id="radio">
      <SectionHead
        eyebrow="Team Radio"
        title="Voices from the cockpit"
        lead="The latest radio exchanges of the session — tap to listen."
      />

      <Stagger className="radio-grid" gap={0.05}>
        {clips.map((clip) => {
          const on = playing === clip.url;
          return (
            <motion.button
              key={clip.url}
              className={`card radio-card${on ? " radio-card--on" : ""}`}
              style={{ ["--tc" as string]: `#${clip.driver.colour}` }}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              onClick={() => toggle(clip.url)}
              data-cursor="play"
              aria-pressed={on}
            >
              <span className="radio-play">
                {on ? (
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
                )}
              </span>
              <span className="radio-info">
                <b className="mono">{clip.driver.acronym}</b>
                <em>{clip.driver.team}</em>
              </span>
              <span className={`radio-wave${on ? " radio-wave--on" : ""}`} aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}
              </span>
              <span className="radio-time mono">
                {clip.date ? new Date(clip.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </motion.button>
          );
        })}
      </Stagger>
    </section>
  );
}
