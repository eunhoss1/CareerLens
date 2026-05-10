import type { ReactNode } from "react";

export function PageHeader({
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
    <section className="border-b border-night bg-paper">
      <div className="lens-container flex flex-col gap-5 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          {kicker && <span className="lens-kicker">{kicker}</span>}
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-night md:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
