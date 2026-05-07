import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type Tone = "default" | "brand" | "success" | "warning" | "risk" | "muted";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#f3f6f1] text-ink">{children}</main>;
}

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

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "subtle" | "danger" }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass(variant)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: "primary" | "secondary" | "subtle" }) {
  return (
    <Link
      className={`inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold transition ${buttonClass(variant)} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

function buttonClass(variant: string) {
  if (variant === "secondary") return "border border-line bg-white text-night hover:border-night";
  if (variant === "subtle") return "border border-line bg-panel text-slate-700 hover:bg-white";
  if (variant === "danger") return "bg-coral text-white hover:brightness-95";
  return "bg-night text-white hover:bg-[#24343a]";
}

export function Card({ children, className = "", elevated = false }: { children: ReactNode; className?: string; elevated?: boolean }) {
  return <div className={`border border-line bg-white ${elevated ? "shadow-panel" : "shadow-sm"} ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-semibold ${badgeClass(tone)} ${className}`}>{children}</span>;
}

export function StatusPill({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return <Badge tone={tone}>{children}</Badge>;
}

function badgeClass(tone: Tone) {
  if (tone === "brand") return "border-brand/20 bg-[#e8f2f1] text-brand";
  if (tone === "success") return "border-mint/20 bg-emerald-50 text-mint";
  if (tone === "warning") return "border-amber/20 bg-amber-50 text-amber";
  if (tone === "risk") return "border-coral/20 bg-red-50 text-coral";
  if (tone === "muted") return "border-line bg-panel text-slate-600";
  return "border-night bg-white text-night";
}

export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {helper && <span className="text-xs font-normal text-slate-400">{helper}</span>}
    </span>
  );
}

export function TextInput({ label, helper, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <input className="h-10 w-full border border-line bg-white px-3 text-sm text-ink focus:border-brand" {...props} />
    </label>
  );
}

export function SelectInput({
  label,
  helper,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <select className="h-10 w-full border border-line bg-white px-3 text-sm text-ink focus:border-brand disabled:bg-slate-100" {...props}>
        {children}
      </select>
    </label>
  );
}

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

function barClass(tone: Tone) {
  if (tone === "success") return "bg-mint";
  if (tone === "warning") return "bg-amber";
  if (tone === "risk") return "bg-coral";
  return "bg-brand";
}

export function MetricCard({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return (
    <div className="border border-line bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-night">{value}</div>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-base font-semibold text-night">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}

export function StepCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <Card className="p-5">
      <span className="text-xs font-bold text-brand">0{index}</span>
      <h3 className="mt-3 text-base font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}

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

export function ChecklistCard({ title, items }: { title: string; items: Array<{ label: string; status: string }> }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-night">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-slate-700">{item.label}</span>
            <StatusPill tone={checklistTone(item.status)}>{item.status}</StatusPill>
          </div>
        ))}
      </div>
    </Card>
  );
}

function checklistTone(status: string): Tone {
  if (status === "완료" || status === "DONE") return "success";
  if (status === "진행 중" || status === "IN_PROGRESS") return "warning";
  return "muted";
}
