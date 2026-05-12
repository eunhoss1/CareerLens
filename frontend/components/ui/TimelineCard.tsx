import type { ReactNode } from "react";

export function TimelineCard({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="relative border border-line bg-white p-5 shadow-sm">
      <div className="absolute left-[-9px] top-6 h-4 w-4 border border-night bg-paper" />
      <p className="text-xs font-bold tracking-[0.16em] text-brand">{label}</p>
      <h3 className="mt-1 text-lg font-semibold text-night">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
