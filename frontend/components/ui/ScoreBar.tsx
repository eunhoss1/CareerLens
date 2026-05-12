import { barClass } from "./style-helpers";
import type { Tone } from "./types";

export function ScoreBar({ label, value, weight, tone = "brand" }: { label: string; value: number; weight?: number; tone?: Tone }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-night">{value}{weight !== undefined ? ` · ${weight}%` : ""}</span>
      </div>
      <div className="mt-2 h-2 border border-line bg-white">
        <div className={`h-full ${barClass(tone)}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
