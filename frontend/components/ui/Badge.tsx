import type { ReactNode } from "react";
import { badgeClass } from "./style-helpers";
import type { Tone } from "./types";

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-semibold ${badgeClass(tone)} ${className}`}>{children}</span>;
}

export function StatusPill({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return <Badge tone={tone}>{children}</Badge>;
}
