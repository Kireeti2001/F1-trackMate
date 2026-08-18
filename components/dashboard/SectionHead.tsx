"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/primitives";
import SplitTitle from "./SplitTitle";

export default function SectionHead({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode; // right-aligned controls
}) {
  return (
    <div className="section-head">
      <div>
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
        <SplitTitle text={title} />
        {lead && (
          <Reveal delay={0.15}>
            <p className="section-lead">{lead}</p>
          </Reveal>
        )}
      </div>
      {children && <div className="section-controls">{children}</div>}
    </div>
  );
}
