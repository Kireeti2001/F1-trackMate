"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Editorial section title: splits its text into words and slides each word up
// from behind a clipping mask as the section scrolls into view.

export default function SplitTitle({
  text,
  as: Tag = "h2",
  className = "section-title",
}: {
  text: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(".split-word > span");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 110, rotate: 4 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.055,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [text]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="split-word" aria-hidden>
          <span>{word}</span>
        </span>
      ))}
    </Tag>
  );
}
