import type { ReactNode } from "react";

export function SectionHeader({
  kicker,
  title,
  description,
  actions
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <p className="text-xs font-bold tracking-[0.16em] text-brand">{kicker}</p>}
        <h2 className="mt-1 text-xl font-semibold text-night">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
